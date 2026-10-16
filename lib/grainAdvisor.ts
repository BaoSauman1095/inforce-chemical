/**
 * Модель «яке зерно продати зараз, щоб найменше втратити».
 *
 * Постановка. У господарства є запас кожної культури Qᵢ (т), ціна зараз pᵢ і
 * очікувана ціна в майбутньому fᵢ (грн/т, ближча до світової). Треба
 * отримати зараз суму C. Продаючи xᵢ т культури i зараз, господарство отримує
 * pᵢ·xᵢ, але недоотримує в майбутньому (Fᵢ − pᵢ)·xᵢ, де Fᵢ — чиста майбутня
 * ціна тонни (майбутня ціна мінус зберігання і втрати за час очікування).
 *
 *   мінімізувати   Σ (Fᵢ − pᵢ)·xᵢ
 *   за умов        Σ pᵢ·xᵢ ≥ C,   0 ≤ xᵢ ≤ Qᵢ
 *
 * Це задача лінійного програмування з одним обмеженням (дробовий рюкзак),
 * тож точний оптимум дає жадібне правило: продавати спершу ту культуру, у
 * якої найменший коефіцієнт kᵢ = Fᵢ / pᵢ — скільки майбутніх гривень
 * коштує одна гривня, отримана зараз. Втрата на 1 грн виторгу = kᵢ − 1.
 *
 * Наприклад, пшениця 5000 → 10000 (k = 2,0), соняшник 15000 → 27000
 * (k = 1,8), кукурудза 4000 → 9000 (k = 2,25): 1 000 000 грн вигідніше
 * взяти з соняшнику (66,7 т), втрата майбутнього доходу 800 000 грн проти
 * 1 000 000 з пшениці і 1 250 000 з кукурудзи.
 */

export interface CropInput {
  id: string;
  name: string;
  /** Запас зерна в наявності, т. */
  stockT: number;
  /** Ціна продажу зараз, грн/т. */
  priceNow: number;
  /** Очікувана ціна в майбутньому (наближена до світової), грн/т. */
  priceFuture: number;
}

export interface AdvisorOptions {
  /** Сума, яку треба отримати зараз, грн. */
  cashNeeded: number;
  /** Через скільки місяців очікується майбутня ціна. */
  months: number;
  /** Вартість зберігання, грн за тонну на місяць. */
  storageCostPerTonMonth: number;
  /** Природні втрати при зберіганні, % маси на місяць. */
  storageLossPctPerMonth: number;
  /** Річна ставка кредиту, % — для порівняння «продати чи позичити». 0 — не порівнювати. */
  creditRatePct: number;
}

export interface CropAnalysis {
  id: string;
  name: string;
  stockT: number;
  priceNow: number;
  priceFuture: number;
  /** Чиста майбутня ціна тонни з урахуванням зберігання і втрат, грн/т. */
  netFuture: number;
  /** Скільки майбутніх гривень коштує 1 грн, отримана зараз. */
  ratio: number;
  /** Втрата майбутнього доходу на 1 грн виторгу зараз (ratio − 1). */
  lossPerUah: number;
  /** Недоотримано з кожної проданої зараз тонни, грн. */
  lossPerTon: number;
  /** Вартість усього запасу за ціною зараз, грн. */
  valueNow: number;
}

export interface SellLine {
  id: string;
  name: string;
  tons: number;
  revenue: number;
  /** Недоотриманий майбутній дохід через продаж зараз, грн. */
  futureLoss: number;
}

export interface Plan {
  lines: SellLine[];
  revenue: number;
  futureLoss: number;
  /** Чи вистачає запасу, щоб зібрати потрібну суму. */
  feasible: boolean;
}

export interface Alternative {
  label: string;
  /** null — запасу цієї культури не вистачає на всю суму. */
  futureLoss: number | null;
}

export interface AdvisorResult {
  crops: CropAnalysis[];
  plan: Plan;
  alternatives: Alternative[];
  /** Дохід, якщо нічого не продавати зараз і все продати в майбутньому, грн. */
  holdAllFuture: number;
  /** Загальний результат за планом: гроші зараз + решта запасу в майбутньому, грн. */
  planTotal: number;
  /** Вартість кредиту на ту саму суму і строк, грн; null — ставку не задано. */
  creditCost: number | null;
  /** Культури, які вигідніше продати зараз незалежно від потреби в грошах. */
  sellNowAnyway: string[];
}

const TON_STEP = 0.1;

function roundUpTons(t: number): number {
  return Math.ceil(t / TON_STEP - 1e-9) * TON_STEP;
}

export function analyzeCrops(crops: CropInput[], opts: AdvisorOptions): CropAnalysis[] {
  const lossShare = Math.min(1, Math.max(0, (opts.storageLossPctPerMonth * opts.months) / 100));
  return crops
    .filter((c) => c.stockT > 0 && c.priceNow > 0 && c.priceFuture > 0)
    .map((c) => {
      const netFuture = c.priceFuture * (1 - lossShare) - opts.storageCostPerTonMonth * opts.months;
      const ratio = netFuture / c.priceNow;
      return {
        id: c.id,
        name: c.name,
        stockT: c.stockT,
        priceNow: c.priceNow,
        priceFuture: c.priceFuture,
        netFuture,
        ratio,
        lossPerUah: ratio - 1,
        lossPerTon: netFuture - c.priceNow,
        valueNow: c.stockT * c.priceNow,
      };
    });
}

/** Оптимальний план: продавати культури в порядку зростання ratio, поки не набрано суму. */
export function buildPlan(crops: CropAnalysis[], cashNeeded: number): Plan {
  const order = [...crops].sort((a, b) => a.ratio - b.ratio);
  const lines: SellLine[] = [];
  let remaining = cashNeeded;
  for (const c of order) {
    if (remaining <= 0) break;
    const tons = Math.min(c.stockT, roundUpTons(remaining / c.priceNow));
    if (tons <= 0) continue;
    const revenue = tons * c.priceNow;
    lines.push({ id: c.id, name: c.name, tons, revenue, futureLoss: tons * c.lossPerTon });
    remaining -= revenue;
  }
  return {
    lines,
    revenue: lines.reduce((s, l) => s + l.revenue, 0),
    futureLoss: lines.reduce((s, l) => s + l.futureLoss, 0),
    feasible: remaining <= 0,
  };
}

export function advise(input: CropInput[], opts: AdvisorOptions): AdvisorResult {
  const crops = analyzeCrops(input, opts);
  const cash = Math.max(0, opts.cashNeeded);
  const plan = buildPlan(crops, cash);

  const alternatives: Alternative[] = crops.map((c) => {
    const tons = roundUpTons(cash / c.priceNow);
    return {
      label: `Лише ${c.name.toLowerCase()}`,
      futureLoss: tons <= c.stockT ? tons * c.lossPerTon : null,
    };
  });
  const totalValueNow = crops.reduce((s, c) => s + c.valueNow, 0);
  if (crops.length > 1 && totalValueNow >= cash && totalValueNow > 0) {
    // Рівною часткою з кожної культури — так часто роблять «щоб не ризикувати».
    const share = cash / totalValueNow;
    alternatives.push({
      label: "Рівною часткою з усіх культур",
      futureLoss: crops.reduce((s, c) => s + c.stockT * share * c.lossPerTon, 0),
    });
  }

  const holdAllFuture = crops.reduce((s, c) => s + c.stockT * c.netFuture, 0);
  const soldById = new Map(plan.lines.map((l) => [l.id, l.tons]));
  const planTotal =
    plan.revenue + crops.reduce((s, c) => s + (c.stockT - (soldById.get(c.id) ?? 0)) * c.netFuture, 0);

  const creditCost =
    opts.creditRatePct > 0 ? (cash * opts.creditRatePct * opts.months) / 1200 : null;

  return {
    crops,
    plan,
    alternatives,
    holdAllFuture,
    planTotal,
    creditCost,
    sellNowAnyway: crops.filter((c) => c.ratio <= 1).map((c) => c.name),
  };
}
