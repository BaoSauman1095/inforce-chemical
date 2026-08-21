/**
 * Best-effort emoji icon for a crop/culture name shown as a pill on the
 * product page. Matched by keyword substring (case-insensitive), most
 * specific first. Falls back to a generic seedling for anything
 * unmatched — non-crop labels like "Пари" or "Землі не с/г призначення"
 * included.
 */
const CROP_ICON_RULES: [string, string][] = [
  ["кукурудз", "🌽"],
  ["соняшник", "🌻"],
  ["ріпак", "🌼"],
  ["соя", "🫘"],
  ["горох", "🫛"],
  ["буряк", "🍠"],
  ["картопл", "🥔"],
  ["капуст", "🥬"],
  ["томат", "🍅"],
  ["огірк", "🥒"],
  ["цибул", "🧅"],
  ["морков", "🥕"],
  ["виноград", "🍇"],
  ["яблун", "🍎"],
  ["суниц", "🍓"],
  ["полуниц", "🍓"],
  ["гречк", "🌾"],
  ["пшениц", "🌾"],
  ["ячмін", "🌾"],
  ["жито", "🌾"],
  ["овес", "🌾"],
  ["тритикале", "🌾"],
  ["просо", "🌾"],
  ["льон", "🌾"],
  ["пасовищ", "🌿"],
  ["трав", "🌿"],
];

export function cropIcon(crop: string): string {
  const lower = crop.toLowerCase();
  const rule = CROP_ICON_RULES.find(([keyword]) => lower.includes(keyword));
  return rule ? rule[1] : "🌱";
}
