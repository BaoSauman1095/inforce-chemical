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

/**
 * Точну форму JSON-відповіді summary_info не перевірено наживо (немає
 * ключа на момент написання) — документація описує лише поля, не вкладеність.
 * Тому шукаємо bid/ask рекурсивно по всьому дереву відповіді, а не за
 * жорстким шляхом: знаходимо об'єкт з полем `ask`, чий найближчий
 * ідентифікатор (поле `translit`/`currency`/`code`, або ключ, під яким
 * об'єкт лежить у батьківському об'єкті) — "usd" чи "eur".
 *
 * Якщо це не спрацює на реальній відповіді — і скрипт, і крон-роут
 * виводять сиру відповідь у лог, і функцію треба буде підправити під
 * фактичну форму.
 */
export function extractAskRates(data: unknown): Partial<Rates> {
  const found: Partial<Rates> = {};

  function visit(node: unknown, keyHint?: string) {
    if (!node || typeof node !== "object") return;

    if (!Array.isArray(node)) {
      const obj = node as Record<string, unknown>;
      const ask = obj.ask;
      if (typeof ask === "number") {
        const idRaw = [obj.translit, obj.currency, obj.code, keyHint].find(
          (v) => typeof v === "string"
        ) as string | undefined;
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

/** Курс продажу (ask) міжбанку — курс, за яким компанія купує валюту, щоб розрахуватися з постачальником. */
export async function fetchRatesFromKurs(apiKey: string): Promise<Rates> {
  const url = `https://kurs.com.ua/api/summary_info?key=${encodeURIComponent(apiKey)}&city=all&currencies=usd,eur&source=mezhbank&format=json`;
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
    throw new Error(
      "Не вдалось знайти курс USD/EUR у відповіді kurs.com.ua — форма відповіді відрізняється від " +
        `очікуваної (див. extractAskRates у lib/rateRefresh.ts). Сира відповідь: ${JSON.stringify(data)}`
    );
  }
  return { USD: rates.USD, EUR: rates.EUR };
}

// Іменовані групи вимагають ES2018+, а спільний tsconfig проєкту тримає
// ES2017 (під наявний рантайм Next.js) — тож нумеровані групи замість них.
const PACK_RE = /slug: "([^"]+)"[\s\S]*?name: "([^"]+)"[\s\S]*?packs: \[([^\n]*?)\],\n/g;
const ENTRY_RE =
  /label: "([^"]*)", price: ([0-9.]+), currency: "(USD|EUR)", indicativePrice: ([0-9.]+)/g;

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
