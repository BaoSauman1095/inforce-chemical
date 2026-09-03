import type { CatalogItem } from "./types";

/**
 * Культури, за якими фільтрується каталог.
 *
 * У `crops` товарів назви записані так, як у реєстрі препаратів: «Пшениця
 * озима», «Пшениця яра», «Зернові колосові» — усе це для покупця та сама
 * пшениця. Тому фільтр працює не за точним збігом рядків, а за `match`:
 * один пункт списку збирає всі варіанти написання.
 *
 * Порядок — за поширеністю в господарствах, а не за алфавітом: перші пункти
 * видно без прокручування меню.
 */
export interface CropFilter {
  key: string;
  label: string;
  icon: string;
  match: RegExp;
}

/**
 * Ад'юванти, прилипачі й частина добрив зареєстровані «на всі культури».
 * Такі позиції показуємо за будь-якої обраної культури — інакше людина,
 * що фільтрує соняшник, не побачить прилипач, який їй теж потрібен.
 */
const UNIVERSAL = /(усі|всі)\s+(культури|польові)|польові культури|обладнання/i;

export const CROP_FILTERS: CropFilter[] = [
  { key: "sunflower", label: "Соняшник", icon: "🌻", match: /соняшник/i },
  { key: "corn", label: "Кукурудза", icon: "🌽", match: /кукурудз/i },
  { key: "soy", label: "Соя", icon: "🫘", match: /(^|[^\p{L}])со[яєї]/iu },
  { key: "wheat", label: "Пшениця", icon: "🌾", match: /пшениц|зернов|колосов/i },
  { key: "barley", label: "Ячмінь", icon: "🌿", match: /ячм[іе]н|зернов|колосов/i },
  { key: "rapeseed", label: "Ріпак", icon: "🌼", match: /ріпак/i },
  { key: "pea", label: "Горох", icon: "🫛", match: /горох|\bнут\b/i },
  { key: "beet", label: "Буряк", icon: "🍠", match: /буряк/i },
  { key: "potato", label: "Картопля", icon: "🥔", match: /картопл/i },
  {
    key: "orchard",
    label: "Сад і виноград",
    icon: "🍇",
    match: /виноград|яблун|груш|черешн|малин|суниц|лохин|плодов|ягідн|горіх|(^|[^\p{L}])сад[иі]?([^\p{L}]|$)/iu,
  },
  {
    key: "vegetables",
    label: "Овочі",
    icon: "🥬",
    match: /овоч|томат|огірк|капуст|цибул|моркв|перець|баклажан|баштан/i,
  },
];

/**
 * Культури позиції. Для насіння окремого поля немає — там культурою є сама
 * категорія («Соняшник», «Кукурудза», «Ріпак»), тож беремо назву групи.
 */
export function itemCropSources(item: CatalogItem, groupTitle: string): string[] {
  return item.crops?.length ? item.crops : [groupTitle];
}

export function matchesCrop(sources: string[], crop: CropFilter): boolean {
  return sources.some((s) => UNIVERSAL.test(s) || crop.match.test(s));
}
