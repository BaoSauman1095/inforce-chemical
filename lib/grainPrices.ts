/**
 * Ціни для калькулятора продажу зерна. Поки що встановлюються вручну нами:
 * `priceNow` — ціна, яку пропонують на внутрішньому ринку зараз,
 * `priceFuture` — очікувана ціна, наближена до світової біржової.
 * Фермер на сторінці може змінити обидві під свої пропозиції.
 * Після зміни цін онови `GRAIN_PRICES_AS_OF`.
 */

export const GRAIN_PRICES_AS_OF = "2026-10-16";

export interface GrainCrop {
  id: string;
  name: string;
  /** Грн/т; undefined — ціну вводить фермер. */
  priceNow?: number;
  priceFuture?: number;
  /** Типова урожайність для підказки в полі, т/га. */
  typicalYield?: number;
}

export const GRAIN_CROPS: GrainCrop[] = [
  { id: "wheat", name: "Пшениця", priceNow: 5000, priceFuture: 10000, typicalYield: 6 },
  { id: "sunflower", name: "Соняшник", priceNow: 15000, priceFuture: 27000, typicalYield: 1.2 },
  { id: "corn", name: "Кукурудза", priceNow: 4000, priceFuture: 9000, typicalYield: 4 },
  { id: "rapeseed", name: "Ріпак", typicalYield: 3 },
  { id: "soy", name: "Соя", typicalYield: 2.5 },
  { id: "barley", name: "Ячмінь", typicalYield: 5 },
];
