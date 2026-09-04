/**
 * Перераховує ціни каталогу за свіжим міжбанківським курсом.
 *
 * Торкається лише позицій, де в lib/catalog-data.ts заданo `currency` і
 * `indicativePrice` (індикативна ціна постачальника без ПДВ, у валюті) —
 * для решти каталогу курс постачальника й далі рахується вручну з прайсу.
 * Нова ціна: `indicativePrice × курс × 1.2` (20% ПДВ), округлено до гривні.
 *
 * Курс береться з kurs.com.ua (не з прайсу постачальника — так вирішив
 * власник: сайт має відображати ринкову ціну, а не ціну на дату видання
 * прайсу) — конкретно колонка «Продаж» (ask) міжбанку, бо це курс, за яким
 * компанія фактично купує валюту, щоб розрахуватися з постачальником.
 *
 * Джерело курсу:
 *   - за замовчуванням: kurs.com.ua API, /api/summary_info?source=mezhbank
 *     (потрібен KURS_API_KEY — див. README «Оновлення курсу валют»);
 *   - або вручну прапорцями --usd / --eur, коли ключа ще немає — взяти
 *     значення з колонки «Продаж» на https://kurs.com.ua/mezhbank.
 *
 * Запуск:
 *   npm run refresh-rate                       — показати, що зміниться
 *   npm run refresh-rate -- --write             — застосувати до файлу
 *   npm run refresh-rate -- --usd 44.629 --eur 51.810 --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CATALOG_PATH = join(__dirname, "..", "lib", "catalog-data.ts");
const VAT = 1.2;

interface Rates {
  USD: number;
  EUR: number;
}

function parseArgs(argv: string[]) {
  const args = { write: false, usd: undefined as number | undefined, eur: undefined as number | undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--write") args.write = true;
    else if (argv[i] === "--usd") args.usd = Number(argv[++i]);
    else if (argv[i] === "--eur") args.eur = Number(argv[++i]);
  }
  return args;
}

/**
 * Точну форму JSON-відповіді summary_info не перевірено наживо (немає
 * ключа на момент написання) — документація описує лише поля, не вкладеність.
 * Тому шукаємо bid/ask рекурсивно по всьому дереву відповіді, а не за
 * жорстким шляхом: знаходимо об'єкт з полем `ask`, чий найближчий
 * ідентифікатор (поле `translit`/`currency`/`code`, або ключ, під яким
 * об'єкт лежить у батьківському об'єкті) — "usd" чи "eur".
 *
 * Якщо це не спрацює на реальній відповіді — перший запуск з --debug
 * виведе сирий JSON, і функцію треба буде підправити під фактичну форму.
 */
function extractAskRates(data: unknown): Partial<Rates> {
  const found: Partial<Rates> = {};

  function visit(node: unknown, keyHint?: string) {
    if (!node || typeof node !== "object") return;

    if (!Array.isArray(node)) {
      const obj = node as Record<string, unknown>;
      const ask = obj.ask;
      if (typeof ask === "number") {
        const idRaw = [obj.translit, obj.currency, obj.code, keyHint]
          .find((v) => typeof v === "string") as string | undefined;
        const id = idRaw?.toLowerCase();
        if (id === "usd" && found.USD === undefined) found.USD = ask;
        if (id === "eur" && found.EUR === undefined) found.EUR = ask;
      }
      for (const [k, v] of Object.entries(obj)) visit(v, k);
    } else {
      for (const item of node) visit(item, keyHint);
    }
  }

  visit(data);
  return found;
}

async function fetchRatesFromApi(): Promise<Rates> {
  const key = process.env.KURS_API_KEY;
  if (!key) {
    throw new Error(
      "Немає KURS_API_KEY. Отримайте ключ через форму заявки на kurs.com.ua " +
        "(див. README) або передайте курс вручну: --usd 44.629 --eur 51.810"
    );
  }

  const url = `https://kurs.com.ua/api/summary_info?key=${encodeURIComponent(key)}&city=all&currencies=usd,eur&source=mezhbank&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`kurs.com.ua відповів ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data && typeof data === "object" && (data as { status?: unknown }).status === false) {
    throw new Error(`kurs.com.ua: ${(data as { error?: string }).error ?? "невідома помилка"}`);
  }

  const rates = extractAskRates(data);
  if (rates.USD === undefined || rates.EUR === undefined) {
    console.error("Не вдалось знайти курс USD/EUR у відповіді. Сира відповідь:");
    console.error(JSON.stringify(data, null, 2));
    throw new Error(
      "Форма відповіді kurs.com.ua відрізняється від очікуваної — see extractAskRates у цьому файлі."
    );
  }
  return { USD: rates.USD, EUR: rates.EUR };
}

interface Change {
  slug: string;
  name: string;
  pack: string;
  currency: "USD" | "EUR";
  indicativePrice: number;
  oldPrice: number;
  newPrice: number;
}

// Іменовані групи вимагають ES2018+, а спільний tsconfig проєкту тримає
// ES2017 (під наявний рантайм Next.js) — тож нумеровані групи замість них.
const PACK_RE = /slug: "([^"]+)"[\s\S]*?name: "([^"]+)"[\s\S]*?packs: \[([^\n]*?)\],\n/g;
const ENTRY_RE =
  /label: "([^"]*)", price: ([0-9.]+), currency: "(USD|EUR)", indicativePrice: ([0-9.]+)/g;

function computeChanges(src: string, rates: Rates): Change[] {
  const changes: Change[] = [];
  PACK_RE.lastIndex = 0;
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = PACK_RE.exec(src))) {
    const [, slug, name, packs] = itemMatch;
    ENTRY_RE.lastIndex = 0;
    let entryMatch: RegExpExecArray | null;
    while ((entryMatch = ENTRY_RE.exec(packs))) {
      const [, label, price, currency, indic] = entryMatch;
      const oldPrice = Number(price);
      const indicativePrice = Number(indic);
      const cur = currency as "USD" | "EUR";
      const newPrice = Math.round(indicativePrice * rates[cur] * VAT);
      if (newPrice !== oldPrice) {
        changes.push({ slug, name, pack: label, currency: cur, indicativePrice, oldPrice, newPrice });
      }
    }
  }
  return changes;
}

function applyChanges(src: string, rates: Rates): { next: string; changes: Change[] } {
  const changes = computeChanges(src, rates);
  const next = src.replace(ENTRY_RE, (_full, label, price, currency, indic) => {
    const cur = currency as "USD" | "EUR";
    const newPrice = Math.round(Number(indic) * rates[cur] * VAT);
    return `label: "${label}", price: ${newPrice}, currency: "${cur}", indicativePrice: ${indic}`;
  });
  return { next, changes };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rates: Rates =
    args.usd !== undefined && args.eur !== undefined
      ? { USD: args.usd, EUR: args.eur }
      : await fetchRatesFromApi();

  console.log(`Курс (ask): USD ${rates.USD}, EUR ${rates.EUR}\n`);

  const src = readFileSync(CATALOG_PATH, "utf-8");
  const { next, changes } = applyChanges(src, rates);

  if (changes.length === 0) {
    console.log("Змін немає — усі прив'язані до курсу ціни вже відповідають цьому курсу.");
    return;
  }

  console.log(`Позицій зі зміною ціни: ${changes.length}\n`);
  for (const c of changes) {
    const sign = c.newPrice > c.oldPrice ? "▲" : "▼";
    console.log(
      `  ${sign} ${c.name} (${c.pack})  ${c.oldPrice} → ${c.newPrice} грн  ` +
        `[${c.indicativePrice} ${c.currency}]  ${c.slug}`
    );
  }

  if (args.write) {
    writeFileSync(CATALOG_PATH, next, "utf-8");
    console.log(`\nЗаписано в ${CATALOG_PATH}. Перевірте tsc/lint/build і закомітьте як завжди.`);
  } else {
    console.log("\nЦе попередній перегляд — файл не змінено. Додайте --write, щоб застосувати.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
