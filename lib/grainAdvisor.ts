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
 *
 * Рентабельність гектара. Якщо задано площу, урожайність і витрати на 1 га,
 * для культури рахується собівартість тонни (витрати / урожайність) і
 * прибуток з 1 га = урожайність × ціна − витрати, рентабельність =
 * прибуток / витрати. Правило «не продавати нижче собівартості» ставить
 * культури, у яких ціна зараз нижча за собівартість тонни, у кінець черги.
 * Витрати вже зроблено, тож мінімум втрат — це водночас максимум сумарного
 * прибутку всіх гектарів; правило може коштувати господарству грошей, тому
 * воно вимкнене за замовчуванням, а `costRule` показує його ціну.
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
  /** Посівна площа, га. */
  areaHa?: number;
  /** Урожайність, т/га. */
  yieldT?: number;
  /** Витрати на вирощування 1 га, грн (насіння, добрива, ЗЗР, паливо, оренда…). */
  costPerHa?: number;
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
  /** Не продавати культури нижче собівартості, поки вистачає інших. */
  protectCost?: boolean;
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
  areaHa?: number;
  yieldT?: number;
  costPerHa?: number;
  /** Собівартість 1 т, грн; undefined — не задано витрат чи урожайності. */
  costPerTon?: number;
  /** Ціна зараз нижча за собівартість тонни. */
  belowCost: boolean;
}

export interface HectareEconomics {
  id: string;
  name: string;
  areaHa: number;
  yieldT: number;
  costPerHa: number;
  costPerTon: number;
  /** Прибуток з 1 га, грн, і рентабельність, % — за ціною зараз. */
  profitNow: number;
  marginNowPct: number;
  /** Те саме за очікуваною ціною (з урахуванням зберігання). */
  profitFuture: number;
  marginFuturePct: number;
  /** Те саме за рекомендованим планом: частина продана зараз, решта потім. */
  profitPlan: number;
  marginPlanPct: number;
  /** Прибуток з усієї площі культури за планом, грн. */
  profitPlanTotal: number;
}

export interface SellLine {
  id: string;
  name: string;
  tons: number;
  revenue: number;
  /** Недоотриманий майбутній дохід через продаж зараз, грн. */
  futureLoss: number;
  /** Продається нижче собівартості. */
  belowCost: boolean;
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
  /** Економіка 1 га — лише для культур із площею, урожайністю і витратами. */
  hectares: HectareEconomics[];
  /** Прибуток усіх гектарів (з витратами) за планом, грн; null — витрати задано не для всіх культур. */
  farmProfit: number | null;
  /**
   * Порівняння з протилежним налаштуванням «не продавати нижче собівартості»:
   * втрата майбутнього доходу з правилом і без. null — правило нічого не змінює.
   */
  costRule: { withRule: number; withoutRule: number } | null;
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
      const costPerTon =
        c.costPerHa && c.costPerHa > 0 && c.yieldT && c.yieldT > 0 ? c.costPerHa / c.yieldT : undefined;
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
        areaHa: c.areaHa,
        yieldT: c.yieldT,
        costPerHa: c.costPerHa,
        costPerTon,
        belowCost: costPerTon !== undefined && c.priceNow < costPerTon,
      };
    });
}

/**
 * Оптимальний план: продавати культури в порядку зростання ratio, поки не
 * набрано суму. З `protectCost` культури нижче собівартості йдуть останніми.
 */
export function buildPlan(crops: CropAnalysis[], cashNeeded: number, protectCost = false): Plan {
  const order = [...crops].sort(
    (a, b) => (protectCost ? Number(a.belowCost) - Number(b.belowCost) : 0) || a.ratio - b.ratio
  );
  const lines: SellLine[] = [];
  let remaining = cashNeeded;
  for (const c of order) {
    if (remaining <= 0) break;
    const tons = Math.min(c.stockT, roundUpTons(remaining / c.priceNow));
    if (tons <= 0) continue;
    const revenue = tons * c.priceNow;
    lines.push({ id: c.id, name: c.name, tons, revenue, futureLoss: tons * c.lossPerTon, belowCost: c.belowCost });
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
  const plan = buildPlan(crops, cash, opts.protectCost);
  const otherPlan = buildPlan(crops, cash, !opts.protectCost);
  const costRule =
    plan.feasible && otherPlan.feasible && Math.abs(otherPlan.futureLoss - plan.futureLoss) > 0.5
      ? opts.protectCost
        ? { withRule: plan.futureLoss, withoutRule: otherPlan.futureLoss }
        : { withRule: otherPlan.futureLoss, withoutRule: plan.futureLoss }
      : null;

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

  const hectares = hectareEconomics(crops, soldById);
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
    hectares,
    farmProfit:
      crops.length > 0 && hectares.length === crops.length
        ? planTotal - crops.reduce((s, c) => s + (c.costPerHa ?? 0) * (c.areaHa ?? 0), 0)
        : null,
    costRule,
  };
}

const pct = (profit: number, cost: number) => (profit / cost) * 100;

/** Прибуток і рентабельність 1 га кожної культури: зараз, за прогнозом і за планом. */
export function hectareEconomics(crops: CropAnalysis[], soldById: Map<string, number>): HectareEconomics[] {
  const out: HectareEconomics[] = [];
  for (const c of crops) {
    if (!c.areaHa || !c.yieldT || !c.costPerHa || c.costPerTon === undefined) continue;
    const sold = Math.min(c.stockT, soldById.get(c.id) ?? 0);
    // Середня ціна тонни за планом: продане — за ціною зараз, решта — за майбутньою.
    const avgPrice = (sold * c.priceNow + (c.stockT - sold) * c.netFuture) / c.stockT;
    const profitNow = c.yieldT * c.priceNow - c.costPerHa;
    const profitFuture = c.yieldT * c.netFuture - c.costPerHa;
    const profitPlan = c.yieldT * avgPrice - c.costPerHa;
    out.push({
      id: c.id,
      name: c.name,
      areaHa: c.areaHa,
      yieldT: c.yieldT,
      costPerHa: c.costPerHa,
      costPerTon: c.costPerTon,
      profitNow,
      marginNowPct: pct(profitNow, c.costPerHa),
      profitFuture,
      marginFuturePct: pct(profitFuture, c.costPerHa),
      profitPlan,
      marginPlanPct: pct(profitPlan, c.costPerHa),
      profitPlanTotal: profitPlan * c.areaHa,
    });
  }
  return out.sort((a, b) => b.profitFuture - a.profitFuture);
}
