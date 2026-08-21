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
  const match = trimmed.match(/(г|гр|мл)\s*$/i);
  if (!match) return false;
  const token = match[1].toLowerCase();
  return (unit === "кг" && (token === "г" || token === "гр")) || (unit === "л" && token === "мл");
}
