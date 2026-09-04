/**
 * Спільна логіка перерахунку каталогу за курсом валют — використовується і
 * скриптом `scripts/refresh-rate.ts` (запуск вручну), і крон-роутом
 * `app/api/cron/refresh-rate/route.ts` (щоденний автозапуск). Тримати в
 * одному місці, а не дублювати регулярки й формулу в обох місцях.
 *
 * Торкається лише позицій, де в lib/catalog-data.ts заданo `currency` і
 * `indicativePrice` (індикативна ціна постачальника без ПДВ, у валюті) —
 * для решти каталогу курс постачальника й далі рахується вручну з прайсу.
 * Нова ціна: `indicativePrice × курс × 1.2` (20% ПДВ), округлено до гривні.
 *
 * Курс береться з публічного API Monobank — див. fetchRatesFromMonobank
 * нижче, чому не kurs.com.ua.
 */

const VAT = 1.2;

export interface Rates {
  USD: number;
  EUR: number;
}

export interface Change {
  slug: string;
  name: string;
  pack: string;
  currency: "USD" | "EUR";
  indicativePrice: number;
  oldPrice: number;
  newPrice: number;
}

/**
 * Джерело курсу — публічний API Monobank, без ключа. Не kurs.com.ua:
 * сторінку /mezhbank Vercel не міг прочитати навіть зі звичайними
 * браузерними заголовками (403 і з ботовим User-Agent, і з
 * Chrome-подібним — отже, блокування не за заголовками, а, найімовірніше,
 * за діапазоном IP серверних функцій). Агрегованого міжбанківського
 * індексу без ключа взагалі не існує — це й є платний продукт
 * kurs.com.ua. З двох перевірених безкоштовних відповідників (Monobank,
 * безготівковий курс ПриватБанку) власник обрав саме Monobank. Курс
 * продажу (rateSell) — вищий з двох чисел пари, той самий принцип, за
 * яким раніше брали «Продаж» на kurs.com.ua.
 */
const MONOBANK_RATES_URL = "https://api.monobank.ua/bank/currency";
const CCY_UAH = 980;
const CCY_USD = 840;
const CCY_EUR = 978;

interface MonobankRateEntry {
  currencyCodeA: number;
  currencyCodeB: number;
  rateSell?: number;
  rateBuy?: number;
  rateCross?: number;
}

export async function fetchRatesFromMonobank(): Promise<Rates> {
  const res = await fetch(MONOBANK_RATES_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`api.monobank.ua відповів ${res.status} ${res.statusText}`);
  }
  const entries = (await res.json()) as MonobankRateEntry[];
  const found: Partial<Rates> = {};
  for (const entry of entries) {
    if (entry.currencyCodeB !== CCY_UAH || entry.rateSell === undefined) continue;
    if (entry.currencyCodeA === CCY_USD) found.USD = entry.rateSell;
    else if (entry.currencyCodeA === CCY_EUR) found.EUR = entry.rateSell;
  }
  if (found.USD === undefined || found.EUR === undefined) {
    throw new Error(
      "Не вдалось знайти курс USD/EUR у відповіді api.monobank.ua — формат відрізняється від " +
        "очікуваного (див. fetchRatesFromMonobank у lib/rateRefresh.ts)."
    );
  }
  return { USD: found.USD, EUR: found.EUR };
}

const SANE_MIN = 20;
const SANE_MAX = 100;
export const JUMP_WARN_PERCENT = 5;

/** Захист саме від сміття з парсера (0, NaN, випадково підхоплена дельта) — не від реального руху курсу. */
export function validateRates(rates: Rates): void {
  for (const [cur, v] of Object.entries(rates) as [string, number][]) {
    if (!Number.isFinite(v) || v < SANE_MIN || v > SANE_MAX) {
      throw new Error(
        `Курс ${cur} = ${v} поза межами адекватності [${SANE_MIN}; ${SANE_MAX}] — це схоже на помилку ` +
          "парсингу сторінки, а не на реальний курс. Оновлення скасовано."
      );
    }
  }
}

// Іменовані групи вимагають ES2018+, а спільний tsconfig проєкту тримає
// ES2017 (під наявний рантайм Next.js) — тож нумеровані групи замість них.
const PACK_RE = /slug: "([^"]+)"[\s\S]*?name: "([^"]+)"[\s\S]*?packs: \[([^\n]*?)\],\n/g;
const ENTRY_RE =
  /label: "([^"]*)", price: ([0-9.]+), currency: "(USD|EUR)", indicativePrice: ([0-9.]+)/g;

/** Курс, що вже застосований у файлі — перший USD- і перший EUR-пакет, зворотним рахунком. Для порівняння «стрибнуло чи ні». */
export function extractBakedRates(src: string): Partial<Rates> {
  const found: Partial<Rates> = {};
  ENTRY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_RE.exec(src))) {
    const [, , price, currency, indic] = m;
    const cur = currency as "USD" | "EUR";
    if (found[cur] === undefined) {
      found[cur] = Number(price) / (Number(indic) * VAT);
    }
    if (found.USD !== undefined && found.EUR !== undefined) break;
  }
  return found;
}

/**
 * Курс може стрибнути на реальну ринкову величину — це не блокує оновлення
 * (власник свідомо хоче відштовхуватись від фактичного курсу), лише
 * позначається в Telegram-повідомленні, щоб людина побачила й за потреби
 * перевірила вручну.
 */
export function detectJump(current: Rates, previous: Partial<Rates>): string | undefined {
  const notes: string[] = [];
  for (const cur of ["USD", "EUR"] as const) {
    const prev = previous[cur];
    if (prev === undefined) continue;
    const pct = (Math.abs(current[cur] - prev) / prev) * 100;
    if (pct >= JUMP_WARN_PERCENT) {
      notes.push(`${cur} ${prev.toFixed(3)} → ${current[cur]} (${pct.toFixed(1)}%)`);
    }
  }
  return notes.length
    ? `Курс змінився більш ніж на ${JUMP_WARN_PERCENT}% за добу: ${notes.join("; ")}`
    : undefined;
}

export function computeChanges(src: string, rates: Rates): Change[] {
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

export function applyChanges(src: string, rates: Rates): { next: string; changes: Change[] } {
  const changes = computeChanges(src, rates);
  const next = src.replace(ENTRY_RE, (_full, label, price, currency, indic) => {
    const cur = currency as "USD" | "EUR";
    const newPrice = Math.round(Number(indic) * rates[cur] * VAT);
    return `label: "${label}", price: ${newPrice}, currency: "${cur}", indicativePrice: ${indic}`;
  });
  return { next, changes };
}
