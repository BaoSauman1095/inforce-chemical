/**
 * Норми природних втрат зерна при зберіганні — Порядок розрахунку норм
 * природних втрат зерна та продуктів його переробки при зберіганні на
 * зернових складах та зернопереробних підприємствах (наказ Мінагрополітики
 * від 12.06.2019 № 316, зареєстровано в Мін'юсті 05.07.2019 за № 743/33714,
 * https://zakon.rada.gov.ua/go/z0743-19).
 *
 * Формули Порядку (X — норма втрат, % маси):
 * - до 3 місяців (в — дні):        X = (б − m) × 0,011 × в + m
 * - понад 3 місяці (в — місяці):    X = а + д × в / г
 *   (а — норма попереднього терміну, д — різниця з нормою наступного,
 *    в — місяців понад попередній термін, г — довжина проміжку)
 * - понад 1 рік: за кожен наступний рік + 0,04 % пропорційно місяцям.
 * m — механічні втрати: склад 0,044 %, елеватор 0,03 %, тара 0,014 %.
 */

export type StorageType = "elevator" | "warehouse" | "bags";

export const STORAGE_TYPES: { id: StorageType; label: string }[] = [
  { id: "elevator", label: "Елеватор" },
  { id: "warehouse", label: "Склад (насипом)" },
  { id: "bags", label: "Склад (у тарі)" },
];

/** Механічні втрати m, %. */
const MECHANICAL: Record<StorageType, number> = { elevator: 0.03, warehouse: 0.044, bags: 0.014 };

/** Біологічні норми з додатка 1: [3 міс., 6 міс., 1 рік], %; null — норму не встановлено. */
type Norms = [number, number, number] | null;

interface NormGroup {
  id: string;
  label: string;
  match: RegExp;
  norms: Record<StorageType, Norms>;
}

const GROUPS: NormGroup[] = [
  {
    id: "wheat",
    label: "Пшениця, жито, ячмінь, полба",
    match: /пшениц|жит|ячм|полб/i,
    norms: { elevator: [0.045, 0.055, 0.095], warehouse: [0.07, 0.09, 0.115], bags: [0.04, 0.06, 0.09] },
  },
  {
    id: "oats",
    label: "Овес",
    match: /овес|вівс/i,
    norms: { elevator: [0.055, 0.065, 0.105], warehouse: [0.09, 0.125, 0.165], bags: [0.05, 0.07, 0.09] },
  },
  {
    id: "rice",
    label: "Рис-зерно",
    match: /рис/i,
    norms: { elevator: [0.045, 0.075, 0.115], warehouse: [0.08, 0.145, 0.105], bags: [0.05, 0.07, 0.1] },
  },
  {
    id: "buckwheat",
    label: "Гречка",
    match: /греч/i,
    norms: { elevator: [0.055, 0.075, 0.1], warehouse: [0.08, 0.11, 0.145], bags: [0.05, 0.07, 0.1] },
  },
  {
    id: "millet",
    label: "Просо, чумиза, сорго",
    match: /просо|чумиз|сорго/i,
    norms: { elevator: [0.06, 0.08, 0.13], warehouse: [0.11, 0.15, 0.19], bags: [0.06, 0.08, 0.1] },
  },
  {
    id: "corn",
    label: "Кукурудза в зерні",
    match: /кукурудз/i,
    norms: { elevator: [0.075, 0.115, 0.155], warehouse: [0.13, 0.165, 0.21], bags: [0.07, 0.1, 0.13] },
  },
  {
    id: "legumes",
    label: "Горох, сочевиця, боби, квасоля, вика, соя",
    match: /горох|сочевиц|боби|квасол|вика|соя|сої/i,
    norms: { elevator: [0.045, 0.06, 0.095], warehouse: [0.07, 0.09, 0.115], bags: [0.04, 0.06, 0.08] },
  },
  {
    id: "sunflower",
    label: "Соняшникове насіння",
    match: /соняшн/i,
    norms: { elevator: [0.13, 0.175, 0.225], warehouse: [0.2, 0.25, 0.3], bags: [0.12, 0.15, 0.2] },
  },
  {
    id: "oilOther",
    label: "Інші олійні культури",
    match: /ріпак|льон|гірчиц|рижі|сафлор/i,
    norms: { elevator: null, warehouse: [0.1, 0.13, 0.17], bags: [0.08, 0.11, 0.14] },
  },
];

const YEARLY_EXTRA = 0.04;

export interface LossNorm {
  /** Норма природних втрат за весь строк, % маси. */
  pct: number;
  groupLabel: string;
}

/** Норма природних втрат для культури за назвою; null — культура не в таблиці або норму не встановлено. */
export function naturalLossNorm(cropName: string, storage: StorageType, months: number): LossNorm | null {
  const group = GROUPS.find((g) => g.match.test(cropName));
  const norms = group?.norms[storage];
  if (!group || !norms || months <= 0) return group && norms ? { pct: 0, groupLabel: group.label } : null;
  const [b3, b6, b12] = norms;
  const m = MECHANICAL[storage];
  let pct: number;
  if (months <= 3) {
    const days = months * 30;
    pct = (b3 - m) * 0.011 * days + m;
  } else if (months <= 6) {
    pct = b3 + ((b6 - b3) * (months - 3)) / 3;
  } else if (months <= 12) {
    pct = b6 + ((b12 - b6) * (months - 6)) / 6;
  } else {
    pct = b12 + (YEARLY_EXTRA * (months - 12)) / 12;
  }
  return { pct, groupLabel: group.label };
}

