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
 * (окремий проєкт inforce-manager) — сюди приходить вже готове, відфільтроване
 * число в гривнях, з ПДВ. Якщо колись знадобиться звірити, звідки взялась
 * конкретна цифра — питання до порталу, не до цього файлу.
 *
 * Контракт з порталом (GET {PUBLIC_PRICES_API_URL}, заголовок
 * `Authorization: Bearer {PUBLIC_PRICES_API_TOKEN}`):
 *
 *   200 OK
 *   [
 *     { "slug": "armada", "packs": [{ "label": "п.о.", "priceUah": 13109 }] },
 *     { "slug": "aviron", "packs": [] }
 *   ]
 *
 * `priceUah` — вже готове число саме для поля `price` у catalog-data.ts:
 * якщо пачка «флетова» (isFlatPackPrice — «п.о.», «500 г» тощо) це сума за
 * упаковку, інакше — ставка за базову одиницю (грн/кг, грн/л), так само, як
 * і решта каталогу вже зберігається (див. packTotalPrice у lib/utils.ts).
 * Перевід із валюти 1С у гривню, додавання ПДВ (×1.2) і вибір курсу — все
 * це рахує портал, тут цієї математики свідомо немає.
 *
 * Безпека (щоб збій чи неповна відповідь порталу не стерли реальні ціни):
 *  - Торкаємось ЛИШЕ (slug, label), які явно присутні у відповіді.
 *    Відсутній у відповіді slug або пачка — ціна каталогу не змінюється.
 *  - `priceUah: null` для присутньої пачки — це явне прибирання ціни
 *    (товар стає «за запитом»). Порожній `packs: []` для slug — це НЕ
 *    команда «прибрати все», а «порталу зараз нема чого сказати про цей
 *    товар» — нічого не чіпаємо.
 *  - Підозріле число (не скінченне, ≤0 або >10 000 000 грн) — пачка
 *    пропускається з попередженням, решта відповіді обробляється.
 *  - Пачка, якої немає в lib/catalog-data.ts під цим slug — попередження,
 *    без падіння всього запуску.
 *  - Коли 1С дає ціну для пачки, яку досі вів курсовий крон
 *    (currency/indicativePrice), ці поля прибираються — товар остаточно
 *    переходить під 1С і далі ігнорується lib/rateRefresh.ts (її regex
 *    вимагає currency+indicativePrice).
 */

export interface Price1CPack {
  label: string;
  /** Готове число для `price`, або null/undefined — явно прибрати ціну. */
  priceUah?: number | null;
}

export interface Price1CEntry {
  slug: string;
  packs: Price1CPack[];
}

export interface Price1CChange {
  slug: string;
  pack: string;
  oldPrice?: number;
  /** undefined — ціну прибрано, товар стає «за запитом». */
  newPrice?: number;
}

export async function fetchPrices1C(): Promise<Price1CEntry[]> {
  const url = process.env.PUBLIC_PRICES_API_URL;
  const token = process.env.PUBLIC_PRICES_API_TOKEN;
  if (!url) throw new Error("Відсутня змінна оточення PUBLIC_PRICES_API_URL");
  if (!token) throw new Error("Відсутня змінна оточення PUBLIC_PRICES_API_TOKEN");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`${url} відповів ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Відповідь ендпоінта цін не є масивом");
  }
  return data as Price1CEntry[];
}

const MAX_SANE_PRICE = 10_000_000;

// Іменовані групи вимагають ES2018+, а спільний tsconfig проєкту тримає
// ES2017 — тож нумеровані групи, так само як у lib/rateRefresh.ts.
const ITEM_RE = /slug: "([^"]+)"[\s\S]*?packs: \[([^\n]*?)\],\n/g;
const PACK_OBJ_RE =
  /\{ label: "([^"]*)"(?:, price: ([0-9.]+))?(?:, currency: "(USD|EUR)")?(?:, indicativePrice: ([0-9.]+))?\s*\}/g;

interface Splice {
  start: number;
  end: number;
  replacement: string;
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
    const entry = bySlug.get(slug);
    if (!entry) continue;
    matchedSlugs.add(slug);

    const seenLabels = new Set<string>();
    let changedThisItem = false;

    const newPacksSrc = packsSrc.replace(
      PACK_OBJ_RE,
      (full, label: string, priceStr: string | undefined) => {
        seenLabels.add(label);
        const wanted = entry.packs.find((p) => p.label === label);
        if (!wanted) return full; // 1С нічого не каже про цю пачку — не чіпаємо

        const oldPrice = priceStr ? Number(priceStr) : undefined;
        const rawNew = wanted.priceUah;
        const newPrice = rawNew === null || rawNew === undefined ? undefined : rawNew;

        if (
          newPrice !== undefined &&
          (!Number.isFinite(newPrice) || newPrice <= 0 || newPrice > MAX_SANE_PRICE)
        ) {
          warnings.push(`${slug} / ${label}: підозріла ціна з 1С (${rawNew}) — пропущено`);
          return full;
        }

        const next = newPrice === undefined ? `{ label: "${label}" }` : `{ label: "${label}", price: ${newPrice} }`;
        if (next === full) return full; // уже таке саме значення — і без currency/indicativePrice тут бути не повинно

        changedThisItem = true;
        changes.push({ slug, pack: label, oldPrice, newPrice });
        return next;
      }
    );

    for (const p of entry.packs) {
      if (!seenLabels.has(p.label)) {
        warnings.push(`${slug}: у каталозі немає пачки з міткою "${p.label}" — пропущено`);
      }
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
