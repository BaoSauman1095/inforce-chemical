export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("uk-UA").format(value);
}

/**
 * True when a pack's price shouldn't be suffixed with "/{unit}" — either
 * because the label is in a sub-unit of the item's base unit (e.g. "500 г"
 * pack on an item priced "грн/кг", or "500 мл" on "грн/л", where `price` is
 * the flat total for that pack, not a per-unit rate), or because the label
 * already just *is* the unit (e.g. pack "п.о." on unit "п.о." — there's no
 * quantity left to repeat). Every other pack size in the catalog is
 * denominated in the same unit as the item itself with a real quantity, so
 * the price is a genuine per-кг/л rate there.
 */
export function isFlatPackPrice(packLabel: string, unit?: string): boolean {
  if (!unit) return false;
  const trimmed = packLabel.trim();
  if (trimmed === unit) return true;
  // Перед суб-одиницею має бути цифра або пробіл, інакше "кг" читалося як
  // "г" і пачка "25 кг" вважалася грамовою — ціна показувалась як сума за
  // пачку замість ставки за кілограм.
  const match = trimmed.match(/(?:^|[\s\d])(г|гр|мл)\s*$/i);
  if (!match) return false;
  const token = match[1].toLowerCase();
  return (unit === "кг" && (token === "г" || token === "гр")) || (unit === "л" && token === "мл");
}

/**
 * Ціна за одну упаковку, у гривнях, або null якщо її не визначити.
 *
 * У каталозі `pack.price` — це або готова сума за упаковку (коли
 * `isFlatPackPrice`: "п.о.", "500 г", "500 мл"), або ставка за одиницю
 * (грн/кг, грн/л). У другому випадку мітка завжди має вигляд "<число> <од>",
 * тож сума за упаковку — це число з мітки, помножене на ставку.
 *
 * Повертає null для позицій без ціни («за запитом») і для міток, з яких
 * кількість не читається — краще не показати суму, ніж показати вигадану.
 */
export function packTotalPrice(
  pack: { label: string; price?: number },
  unit?: string
): number | null {
  if (typeof pack.price !== "number") return null;
  if (isFlatPackPrice(pack.label, unit)) return pack.price;

  const amount = pack.label.trim().match(/^([\d]+(?:[.,]\d+)?)/);
  if (!amount) return null;

  return pack.price * Number(amount[1].replace(",", "."));
}

/**
 * Телефон у міжнародному форматі +380XXXXXXXXX.
 *
 * Потрібен для повідомлень у Telegram: клієнти лінкують номери саме в
 * такому вигляді, тож менеджер може подзвонити одним дотиком, а не
 * переписувати номер руками. Схема введення вже нормалізована zod-ом
 * (без пробілів і дефісів), тут лишається звести до +380.
 */
export function formatPhoneIntl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("380")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+38${digits}`;
  return phone;
}
