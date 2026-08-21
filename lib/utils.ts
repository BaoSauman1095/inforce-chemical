export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("uk-UA").format(value);
}

/**
 * True when a pack's own label is in a sub-unit of the item's base unit
 * (e.g. "500 г" pack on an item priced "грн/кг", or "500 мл" on "грн/л").
 * For these, `price` is the flat total for that pack, not a per-unit rate —
 * every other pack size in the catalog is denominated in the same unit as
 * the item itself, so the price is a genuine per-кг/л rate there.
 */
export function isFlatPackPrice(packLabel: string, unit?: string): boolean {
  if (!unit) return false;
  const match = packLabel.trim().match(/(г|гр|мл)\s*$/i);
  if (!match) return false;
  const token = match[1].toLowerCase();
  return (unit === "кг" && (token === "г" || token === "гр")) || (unit === "л" && token === "мл");
}
