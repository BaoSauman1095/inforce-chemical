import { isFlatPackPrice } from "./utils";

/**
 * Злиття цін із 1С у lib/catalog-data.ts — той самий патерн, що й
 * lib/rateRefresh.ts для курсу валют (використовується і тут, і в
 * крон-роуті app/api/cron/sync-1c-prices/route.ts): крон читає готовий
 * JSON від ендпоінта порталу менеджерів, знаходить відповідні slug/пачку в
 * тексті файлу й підміняє лише числове поле `price`.
 *
 * Сайт НЕ ходить у 1С напряму (немає доступу з мережі Vercel) і не знає
 * жодних бізнес-правил 1С — умову продажу (Н11 передоплата проти Н1
 * кредит/Н6 вексель), валюту, курс, заглушки «ціну не задано» (9999.99
 * тощо), мінімальну ціну. Усе це вже застосоване на боці порталу
 * (https://inforcechemical.online/api/public-prices, окремий проєкт
 * inforce-manager) — сюди приходить вже готове число в гривнях, з ПДВ.
 *
 * Контракт (підтверджено на реальному ендпоінті):
 *
 *   GET {PUBLIC_PRICES_API_URL}
 *   Authorization: Bearer {PUBLIC_PRICES_API_TOKEN}
 *
 *   200 OK
 *   {
 *     "ok": true,
 *     "vat": 1.2,
 *     "priceType": "prepay_indicative",
 *     "currency": "UAH",
 *     "asOf": "2026-10-05T06:33:54.898Z",
 *     "count": 203,
 *     "products": [
 *       {
 *         "slug": "imisid-bt",
 *         "unit": "л",
 *         "priceUahPerUnitFrom": 1129.4,
 *         "packs": [
 *           {
 *             "characteristic": "5 л",
 *             "packLabel": "5 л",
 *             "packSize": 5,
 *             "priceUahPerUnit": 1129.4,
 *             "priceUahPerPack": 5647.02,
 *             "source": { "value": 20.92, "currency": "USD", "rate": 44.989 }
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *   401 — токен хибний/відсутній. 503 — на порталі не налаштовано токен.
 *
 * `priceUahPerUnit`/`priceUahPerPack` — уже готові числа (з ПДВ, перевід у
 * гривню й усе інше вже застосовано на порталі). Яке з двох іде в поле
 * `price` каталогу — вирішує сам каталог: для «флетових» пачок
 * (isFlatPackPrice — «п.о.», «500 г» тощо) це сума за упаковку
 * (`priceUahPerPack`), інакше — ставка за базову одиницю, грн/кг чи грн/л
 * (`priceUahPerUnit`), так само, як решта каталогу вже зберігається (див.
 * packTotalPrice у lib/utils.ts). `source` — лише для логів/перевірки,
 * на сайт не виводиться.
 *
 * `packLabel` може бути `null` (фасування не розпізнане порталом, типовий
 * випадок — насіння з одним-єдиним «п.о.»). У такому разі пачка
 * зіставляється з єдиною пачкою каталогу під цим slug — якщо пачок
 * декілька, зіставити нема як, це потрапляє в попередження.
 *
 * Безпека (щоб збій чи неповна відповідь порталу не стерли реальні ціни):
 *  - Торкаємось ЛИШЕ (slug, пачка), які явно присутні у відповіді.
 *    Відсутній у відповіді slug або пачка — ціна каталогу не змінюється
 *    (товарів без ціни портал не віддає взагалі — відсутність slug означає
 *    «портал ще не знає цей товар», а не «ціну прибрати»).
 *  - Підозріле число (не скінченне, ≤0 або >10 000 000) — пачка
 *    пропускається з попередженням, решта відповіді обробляється.
 *  - Пачка, якої немає в lib/catalog-data.ts під цим slug (за packLabel,
 *    або — коли він null — за єдиністю пачки) — попередження, без
 *    падіння всього запуску.
 *  - `currency !== "UAH"` чи `priceType !== "prepay_indicative"` у
 *    відповіді — це сигнал, що портал раптом почав віддавати щось інше,
 *    ніж «індикативна передоплата в гривні» (власник явно просив ТІЛЬКИ
 *    її) — весь запуск скасовується, зміни каталогу не застосовуються.
 *  - Коли 1С дає ціну для пачки, яку досі вів курсовий крон
 *    (currency/indicativePrice), ці поля прибираються — товар остаточно
 *    переходить під 1С і далі ігнорується lib/rateRefresh.ts (її regex
 *    вимагає currency+indicativePrice).
 */

export interface Price1CPack {
  characteristic: string | null;
  packLabel: string | null;
  packSize: number;
  priceUahPerUnit: number;
  priceUahPerPack: number;
}

export interface Price1CEntry {
  slug: string;
  unit?: string;
  packs: Price1CPack[];
}

interface PublicPricesResponse {
  ok: boolean;
  vat: number;
  priceType: string;
  currency: string;
  asOf: string;
  count: number;
  products: Price1CEntry[];
}

const EXPECTED_PRICE_TYPE = "prepay_indicative";
const EXPECTED_CURRENCY = "UAH";
const EXPECTED_VAT = 1.2;

export async function fetchPrices1C(): Promise<Price1CEntry[]> {
  const url = process.env.PUBLIC_PRICES_API_URL;
  const token = process.env.PUBLIC_PRICES_API_TOKEN;
  if (!url) throw new Error("Відсутня змінна оточення PUBLIC_PRICES_API_URL");
  if (!token) throw new Error("Відсутня змінна оточення PUBLIC_PRICES_API_TOKEN");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new Error(`${url}: 401 — токен хибний або відсутній`);
  }
  if (res.status === 503) {
    throw new Error(`${url}: 503 — на порталі не налаштовано токен`);
  }
  if (!res.ok) {
    throw new Error(`${url} відповів ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as PublicPricesResponse;

  if (!data.ok) {
    throw new Error("Відповідь порталу має ok: false");
  }
  if (!Array.isArray(data.products)) {
    throw new Error("Відповідь порталу не містить масиву products");
  }
  if (data.currency !== EXPECTED_CURRENCY) {
    throw new Error(
      `Портал віддає ціни у валюті "${data.currency}", очікувалось "${EXPECTED_CURRENCY}" — оновлення скасовано`
    );
  }
  if (data.priceType !== EXPECTED_PRICE_TYPE) {
    throw new Error(
      `Портал віддає priceType "${data.priceType}", очікувалось "${EXPECTED_PRICE_TYPE}" — ` +
        "на сайт має йти лише індикативна ціна передоплати, оновлення скасовано"
    );
  }
  if (data.vat !== EXPECTED_VAT) {
    throw new Error(
      `Портал віддає vat ${data.vat}, очікувалось ${EXPECTED_VAT} — ставка ПДВ змінилась або помилка в порталі, оновлення скасовано`
    );
  }

  return data.products;
}

const MAX_SANE_PRICE = 10_000_000;

// Іменовані групи вимагають ES2018+, а спільний tsconfig проєкту тримає
// ES2017 — тож нумеровані групи, так само як у lib/rateRefresh.ts.
const ITEM_RE = /slug: "([^"]+)"[\s\S]*?packs: \[([^\n]*?)\],\n\s*unit: "([^"]*)"/g;
const PACK_OBJ_RE =
  /\{ label: "([^"]*)"(?:, price: ([0-9.]+))?(?:, currency: "(USD|EUR)")?(?:, indicativePrice: ([0-9.]+))?\s*\}/g;

export interface Price1CChange {
  slug: string;
  pack: string;
  oldPrice?: number;
  /** undefined — ціну прибрано, товар стає «за запитом». */
  newPrice?: number;
}

interface Splice {
  start: number;
  end: number;
  replacement: string;
}

/** Готове число для `price` каталогу під цю пачку — ставка чи сума за упаковку, залежно від типу пачки. */
function pickPrice(pack: Price1CPack, label: string, unit: string): number {
  return isFlatPackPrice(label, unit) ? pack.priceUahPerPack : pack.priceUahPerUnit;
}

export function applyPrice1CChanges(
  src: string,
  entries: Price1CEntry[]
): { next: string; changes: Price1CChange[]; warnings: string[] } {
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const changes: Price1CChange[] = [];
  const warnings: string[] = [];
  const splices: Splice[] = [];
  const matchedSlugs = new Set<string>();

  ITEM_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ITEM_RE.exec(src))) {
    const slug = m[1];
    const packsSrc = m[2];
    const unit = m[3];
    const entry = bySlug.get(slug);
    if (!entry) continue;
    matchedSlugs.add(slug);

    const catalogLabels = Array.from(packsSrc.matchAll(PACK_OBJ_RE)).map((pm) => pm[1]);
    const singleCatalogPack = catalogLabels.length === 1 ? catalogLabels[0] : undefined;

    const usedPortalPacks = new Set<number>();
    const seenLabels = new Set<string>();
    let changedThisItem = false;

    const newPacksSrc = packsSrc.replace(
      PACK_OBJ_RE,
      (full, label: string, priceStr: string | undefined) => {
        seenLabels.add(label);

        let wantedIndex = entry.packs.findIndex((p) => p.packLabel === label);
        if (wantedIndex === -1 && label === singleCatalogPack) {
          wantedIndex = entry.packs.findIndex((p) => p.packLabel === null);
        }
        if (wantedIndex === -1) return full; // портал нічого не каже про цю пачку — не чіпаємо
        usedPortalPacks.add(wantedIndex);

        const wanted = entry.packs[wantedIndex];
        const rawNew = pickPrice(wanted, label, unit);

        if (!Number.isFinite(rawNew) || rawNew <= 0 || rawNew > MAX_SANE_PRICE) {
          warnings.push(`${slug} / ${label}: підозріла ціна з 1С (${rawNew}) — пропущено`);
          return full;
        }
        const newPrice = Math.round(rawNew);
        const oldPrice = priceStr ? Number(priceStr) : undefined;

        const next = `{ label: "${label}", price: ${newPrice} }`;
        if (next === full) return full;

        changedThisItem = true;
        changes.push({ slug, pack: label, oldPrice, newPrice });
        return next;
      }
    );

    entry.packs.forEach((p, i) => {
      if (usedPortalPacks.has(i)) return;
      const labelDesc = p.packLabel ?? p.characteristic ?? "(без мітки)";
      warnings.push(`${slug}: у каталозі немає пачки з міткою "${labelDesc}" — пропущено`);
    });

    if (entry.unit !== undefined && entry.unit !== unit) {
      warnings.push(
        `${slug}: одиниця з порталу ("${entry.unit}") не збігається з каталогом ("${unit}") — перевірте вручну`
      );
    }

    if (changedThisItem) {
      const start = m.index + m[0].lastIndexOf(packsSrc);
      splices.push({ start, end: start + packsSrc.length, replacement: newPacksSrc });
    }
  }

  for (const entry of entries) {
    if (!matchedSlugs.has(entry.slug)) {
      warnings.push(`${entry.slug}: немає такого товару в lib/catalog-data.ts — пропущено`);
    }
  }

  let next = "";
  let cursor = 0;
  for (const s of splices) {
    next += src.slice(cursor, s.start) + s.replacement;
    cursor = s.end;
  }
  next += src.slice(cursor);

  return { next, changes, warnings };
}
