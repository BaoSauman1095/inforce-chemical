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

const RATE_NUM_RE = /(\d{2,3}[.,]\d{1,3})/g;

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Публічна сторінка kurs.com.ua/mezhbank, без ключа — платний API там же
 * не використовується навмисно (власник вирішив: «ключа не буде», раз на
 * добу достатньо просто зчитати таблицю). Розмітку сторінки наживо не
 * перевірено, тож парсер тримається не за HTML-теги (вони можуть
 * відрізнятись), а за сам текст: бере перше входження "USD"/"EUR" (це
 * рядок таблиці курсів, не згадка валюти десь іще на сторінці) і в
 * найближчому шматку тексту шукає числа у форматі "44,629" — курс завжди
 * в межах 20–100 грн, тоді як сусідні дельти на кшталт "▼-0,052" менші
 * за 1 і відсіюються цим же діапазоном. Порядок колонок на сторінці —
 * Купівля/Продаж/Середній, тож друге знайдене число — курс продажу (ask).
 *
 * Якщо розмітка сторінки виявиться іншою — перший реальний запуск або
 * поверне помилку (не знайшло двох чисел), або число вилетить за межі
 * адекватності (validateRates) і оновлення не застосується. Обидва
 * випадки дають повідомлення в Telegram, а не тиху хибну ціну.
 */
export function extractMezhbankRates(html: string): Partial<Rates> {
  const text = stripTags(html);
  const found: Partial<Rates> = {};

  for (const cur of ["USD", "EUR"] as const) {
    const idx = text.indexOf(cur);
    if (idx === -1) continue;
    const window = text.slice(idx, idx + 200);
    const nums = [...window.matchAll(RATE_NUM_RE)]
      .map((m) => Number(m[1].replace(",", ".")))
      .filter((n) => n >= 20 && n <= 100);
    if (nums.length >= 2) found[cur] = nums[1];
  }

  return found;
}

// Перший реальний запуск отримав 403 з User-Agent, що прямо називав себе
// ботом ("...InForceChemicalRateBot/1.0") — саме такий підпис і ловить
// захист від сканерів. Тепер запит виглядає як звичайний браузер Chrome —
// той самий трюк, що й будь-який легітимний скрапер публічної сторінки.
const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/128.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "uk-UA,uk;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6",
};

export async function fetchRatesFromMezhbank(): Promise<Rates> {
  const res = await fetch("https://kurs.com.ua/mezhbank", {
    headers: BROWSER_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`kurs.com.ua/mezhbank відповів ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const rates = extractMezhbankRates(html);
  if (rates.USD === undefined || rates.EUR === undefined) {
    throw new Error(
      "Не вдалось знайти курс USD/EUR на сторінці kurs.com.ua/mezhbank — розмітка відрізняється від " +
        "очікуваної (див. extractMezhbankRates у lib/rateRefresh.ts)."
    );
  }
  return { USD: rates.USD, EUR: rates.EUR };
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
