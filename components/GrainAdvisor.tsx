"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { advise, type CropInput } from "@/lib/grainAdvisor";
import { GRAIN_CROPS, GRAIN_PRICES_AS_OF } from "@/lib/grainPrices";
import { naturalLossNorm, STORAGE_TYPES, type StorageType } from "@/lib/grainLossNorms";

interface CropRow {
  key: string;
  name: string;
  area: string;
  yieldT: string;
  /** Порожньо — запас дорівнює валовому збору (площа × урожайність). */
  stock: string;
  priceNow: string;
  priceFuture: string;
  /** Витрати на 1 га, грн; порожньо — рентабельність не рахується. */
  costPerHa?: string;
  /** Кукурудза: лишається в полі, збирання взимку чи навесні. Втрати вводить фермер, не норми наказу № 316. */
  inField?: boolean;
  /** Втрати врожаю в полі за весь строк очікування, % маси. */
  fieldLoss?: string;
}

interface FormState {
  rows: CropRow[];
  cash: string;
  months: string;
  storageCost: string;
  storageLoss: string;
  creditRate: string;
  protectCost?: boolean;
  /** Де зберігається зерно: втрати маси — за нормами наказу № 316; "custom" — свій % на місяць. */
  storageType?: StorageType | "custom";
}

const STORAGE_KEY = "grain-advisor-v1";

function rowFromCrop(id: string, area: number, yieldT: number): CropRow {
  const c = GRAIN_CROPS.find((x) => x.id === id)!;
  return {
    key: `${id}-${Math.random().toString(36).slice(2, 7)}`,
    name: c.name,
    area: String(area),
    yieldT: String(yieldT),
    stock: "",
    priceNow: c.priceNow ? String(c.priceNow) : "",
    priceFuture: c.priceFuture ? String(c.priceFuture) : "",
    costPerHa: "",
  };
}

const DEFAULT_STATE: FormState = {
  rows: [rowFromCrop("wheat", 300, 6), rowFromCrop("sunflower", 500, 1.2), rowFromCrop("corn", 200, 4)],
  cash: "1000000",
  months: "6",
  storageCost: "0",
  storageLoss: "0",
  creditRate: "0",
  protectCost: false,
  storageType: "warehouse",
};

function num(v: string): number {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const canStayInField = (name: string) => /кукурудз/i.test(name);

function grossOf(r: CropRow): number {
  return num(r.area) * num(r.yieldT);
}

function stockOf(r: CropRow): number {
  return r.stock.trim() ? num(r.stock) : grossOf(r);
}

const uah = (v: number) => `${formatPrice(Math.round(v))} грн`;
const tons = (v: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(Math.round(v * 10) / 10)} т`;
const hectaresFmt = (v: number) =>
  new Intl.NumberFormat("uk-UA", { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v);
const pctFine = (v: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 3 }).format(Math.round(v * 1000) / 1000)}%`;
const formatPct = (v: number) =>
  `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(Math.round(v))}%`;
const coef = (v: number) => new Intl.NumberFormat("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

function NumField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#8a8582]">{label}</span>
      <span className="mt-1 flex items-center rounded-[10px] border border-[#dcd8d5] bg-white focus-within:border-brand">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 rounded-[10px] bg-transparent px-3 py-2.5 text-[15px] text-[#141414] outline-none"
        />
        {suffix && <span className="flex-none pr-3 text-[12.5px] text-[#8a8582]">{suffix}</span>}
      </span>
    </label>
  );
}

function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[22px] bg-card p-5 shadow-panel sm:p-7", className)}>
      {title && <h2 className="mb-4 font-heading text-lg font-bold text-[#141414] sm:text-xl">{title}</h2>}
      {children}
    </section>
  );
}

export default function GrainAdvisor() {
  const [state, setState] = useState<FormState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...DEFAULT_STATE, ...JSON.parse(saved) });
    } catch {
      /* без збереженого стану — працюємо з прикладом */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* приватний режим — просто не зберігаємо */
    }
  }, [state, loaded]);

  const set = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));
  const setRow = (key: string, patch: Partial<CropRow>) =>
    setState((s) => ({ ...s, rows: s.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeRow = (key: string) => setState((s) => ({ ...s, rows: s.rows.filter((r) => r.key !== key) }));
  const addRow = (id: string) => {
    const c = GRAIN_CROPS.find((x) => x.id === id);
    if (!c) return;
    setState((s) => ({ ...s, rows: [...s.rows, rowFromCrop(id, 0, c.typicalYield ?? 0)] }));
  };

  const cash = num(state.cash);
  const months = num(state.months);
  const storageType = state.storageType ?? "warehouse";
  const normFor = (name: string) =>
    storageType === "custom" ? null : naturalLossNorm(name, storageType, months);
  const inFieldOf = (r: CropRow) => !!r.inField && canStayInField(r.name);
  const lossRows = state.rows.map((r) => {
    const field = inFieldOf(r);
    const norm = field ? null : normFor(r.name);
    const pct = field ? num(r.fieldLoss ?? "") : norm?.pct ?? 0;
    const lostT = (stockOf(r) * pct) / 100;
    return { key: r.key, name: r.name.trim() || "Культура", norm, field, pct, lostT, lostUah: lostT * num(r.priceFuture) };
  });
  const lossTotal = lossRows.reduce((t, l) => ({ tons: t.tons + l.lostT, uah: t.uah + l.lostUah }), { tons: 0, uah: 0 });
  const result = useMemo(() => {
    const crops: CropInput[] = state.rows.map((r) => ({
      id: r.key,
      name: r.name.trim() || "Культура",
      stockT: stockOf(r),
      priceNow: num(r.priceNow),
      priceFuture: num(r.priceFuture),
      areaHa: num(r.area),
      yieldT: num(r.yieldT),
      costPerHa: num(r.costPerHa ?? ""),
      lossPct: inFieldOf(r)
        ? num(r.fieldLoss ?? "")
        : storageType === "custom"
          ? undefined
          : naturalLossNorm(r.name, storageType, months)?.pct,
      storageCostPerTonMonth: inFieldOf(r) ? 0 : undefined,
    }));
    return advise(crops, {
      cashNeeded: cash,
      months,
      storageCostPerTonMonth: num(state.storageCost),
      storageLossPctPerMonth: num(state.storageLoss),
      creditRatePct: num(state.creditRate),
      protectCost: !!state.protectCost,
    });
  }, [state, cash, months, storageType]);

  const { plan, crops } = result;
  const sorted = [...crops].sort((a, b) => a.ratio - b.ratio);
  const maxLoss = Math.max(0.01, ...sorted.map((c) => Math.abs(c.lossPerUah)));
  const feasibleAlts = result.alternatives.filter((a) => a.futureLoss !== null) as { label: string; futureLoss: number }[];
  const worstAlt = feasibleAlts.reduce<{ label: string; futureLoss: number } | null>(
    (w, a) => (!w || a.futureLoss > w.futureLoss ? a : w),
    null
  );
  const saving = worstAlt ? worstAlt.futureLoss - plan.futureLoss : 0;
  const best = sorted[0];
  const usedNames = new Set(state.rows.map((r) => r.name));
  const addable = GRAIN_CROPS.filter((c) => !usedNames.has(c.name));
  const creditBetter = result.creditCost !== null && plan.feasible && result.creditCost < plan.futureLoss;
  const ready = cash > 0 && crops.length > 0;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 md:px-7 md:pt-12">
      <p className="text-[11.5px] font-semibold uppercase tracking-[.18em] text-brand-light">Інструмент для фермера</p>
      <h1 className="mt-2 font-heading text-[28px] font-extrabold leading-tight tracking-tight text-paper sm:text-[38px]">
        Яке зерно продати зараз, щоб найменше втратити
      </h1>
      <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-paper/70">
        Внесіть культури господарства, ціни зараз і очікувані ціни, наближені до світових. Калькулятор
        підбере, яку культуру і скільки тонн продати, щоб отримати потрібну суму і недоотримати в
        майбутньому якомога менше.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Ваше господарство">
            <div className="flex flex-col gap-4">
              {state.rows.map((r) => {
                const gross = grossOf(r);
                return (
                  <div key={r.key} className="rounded-2xl border border-[#ebe7e4] p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <input
                        value={r.name}
                        onChange={(e) => setRow(r.key, { name: e.target.value })}
                        aria-label="Назва культури"
                        className="min-w-0 flex-1 rounded-lg bg-transparent font-heading text-[17px] font-bold text-[#141414] outline-none focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(r.key)}
                        className="tap-44 flex-none rounded-md px-2.5 py-1 text-[12.5px] font-semibold text-[#8a8582] hover:text-brand"
                      >
                        Прибрати
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <NumField label="Площа" suffix="га" value={r.area} onChange={(v) => setRow(r.key, { area: v })} />
                      <NumField label="Урожайність" suffix="т/га" value={r.yieldT} onChange={(v) => setRow(r.key, { yieldT: v })} />
                      <NumField
                        label="В наявності"
                        suffix="т"
                        value={r.stock}
                        placeholder={gross ? new Intl.NumberFormat("uk-UA").format(Math.round(gross * 10) / 10) : "0"}
                        onChange={(v) => setRow(r.key, { stock: v })}
                      />
                      <NumField label="Ціна зараз" suffix="грн/т" value={r.priceNow} onChange={(v) => setRow(r.key, { priceNow: v })} />
                      <NumField
                        label="Очікувана ціна"
                        suffix="грн/т"
                        value={r.priceFuture}
                        onChange={(v) => setRow(r.key, { priceFuture: v })}
                      />
                      <NumField
                        label="Витрати на 1 га"
                        suffix="грн/га"
                        value={r.costPerHa ?? ""}
                        placeholder="необов'язково"
                        onChange={(v) => setRow(r.key, { costPerHa: v })}
                      />
                    </div>
                    <p className="mt-2.5 text-[12.5px] text-[#8a8582]">
                      Валовий збір: {tons(gross)}
                      {r.stock.trim() ? ` · у розрахунку: ${tons(stockOf(r))}` : ""}
                      {num(r.costPerHa ?? "") > 0 && num(r.yieldT) > 0
                        ? ` · собівартість 1 т: ${uah(num(r.costPerHa ?? "") / num(r.yieldT))}`
                        : ""}
                    </p>
                    {canStayInField(r.name) && (
                      <div className="mt-3 rounded-xl bg-[#f6f3f1] p-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!r.inField}
                            onChange={(e) => setRow(r.key, { inField: e.target.checked })}
                            className="mt-1 h-4 w-4 flex-none accent-[#8B1A2B]"
                          />
                          <span className="text-[14px] leading-snug text-[#3d3a38]">
                            Залишити в полі (збирання взимку або навесні)
                            <span className="mt-0.5 block text-[12.5px] text-[#8a8582]">
                              У полі втрати більші, ніж у сховищі, і норми наказу № 316 на них не поширюються — введіть
                              свої.
                            </span>
                          </span>
                        </label>
                        {r.inField && (
                          <div className="mt-3 max-w-[260px]">
                            <NumField
                              label="Втрати в полі за весь строк"
                              suffix="% маси"
                              value={r.fieldLoss ?? ""}
                              onChange={(v) => setRow(r.key, { fieldLoss: v })}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {!inFieldOf(r) && storageType !== "custom" && months > 0 && (
                      <p className="mt-1 text-[12.5px] text-[#8a8582]">
                        {(() => {
                          const n = normFor(r.name);
                          return n
                            ? `Природні втрати за ${formatPrice(months)} міс.: ${pctFine(n.pct)} маси (${tons((stockOf(r) * n.pct) / 100)}) — норма наказу № 316`
                            : `Норму природних втрат для цієї культури${storageType === "elevator" ? " в елеваторі" : ""} не встановлено — враховано ${state.storageLoss || "0"} %/міс`;
                        })()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {addable.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {addable.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addRow(c.id)}
                    className="tap-44 rounded-md bg-brand/[.08] px-3 py-1.5 text-[13px] font-semibold text-brand hover:bg-brand/[.16]"
                  >
                    + {c.name}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-4 text-[12.5px] leading-relaxed text-[#8a8582]">
              Ціни за замовчуванням встановлені IN FORCE CHEMICAL станом на{" "}
              {new Date(GRAIN_PRICES_AS_OF).toLocaleDateString("uk-UA")}. Змініть їх під пропозиції, які отримуєте ви.
            </p>
          </Panel>

          <Panel title="Скільки грошей потрібно зараз">
            <NumField label="Сума" suffix="грн" value={state.cash} onChange={(v) => set({ cash: v })} />
            <details className="mt-5 group">
              <summary className="cursor-pointer list-none text-[14px] font-semibold text-brand">
                <span className="group-open:hidden">+ Зберігання, строк і кредит</span>
                <span className="hidden group-open:inline">− Зберігання, строк і кредит</span>
              </summary>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.1em] text-[#8a8582]">
                Де зберігається зерно
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {[...STORAGE_TYPES, { id: "custom" as const, label: "Свій % втрат" }].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set({ storageType: t.id })}
                    className={cn(
                      "tap-44 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                      storageType === t.id ? "bg-brand text-white" : "bg-brand/[.08] text-brand hover:bg-brand/[.16]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <NumField label="Чекати ціну" suffix="міс" value={state.months} onChange={(v) => set({ months: v })} />
                <NumField label="Зберігання" suffix="грн/т·міс" value={state.storageCost} onChange={(v) => set({ storageCost: v })} />
                <NumField label="Ставка кредиту" suffix="% річних" value={state.creditRate} onChange={(v) => set({ creditRate: v })} />
                {(storageType === "custom" || lossRows.some((l) => !l.norm)) && (
                  <NumField
                    label={storageType === "custom" ? "Втрати маси" : "Втрати для культур без норми"}
                    suffix="%/міс"
                    value={state.storageLoss}
                    onChange={(v) => set({ storageLoss: v })}
                  />
                )}
              </div>
              {(storageType !== "custom" || lossRows.some((l) => l.field)) && lossRows.length > 0 && (
                <div className="mt-4 rounded-2xl bg-[#f6f3f1] p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#8a8582]">
                    Втрати маси за {formatPrice(months)} міс.
                    {storageType !== "custom" ? ` · ${STORAGE_TYPES.find((t) => t.id === storageType)?.label}` : ""}
                  </p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {lossRows
                      .filter((l) => storageType !== "custom" || l.field)
                      .map((l) => (
                      <div key={l.key} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                        <span className="text-[#141414]">{l.name}</span>
                        <span className="text-right text-[#5f5b58]">
                          {l.field
                            ? l.pct > 0
                              ? `в полі ${pctFine(l.pct)} · ${tons(l.lostT)}${l.lostUah > 0 ? ` ≈ ${uah(l.lostUah)}` : ""}`
                              : "в полі: введіть % втрат"
                            : l.norm
                              ? `${pctFine(l.norm.pct)} · ${tons(l.lostT)}${l.lostUah > 0 ? ` ≈ ${uah(l.lostUah)}` : ""}`
                              : storageType === "custom"
                                ? `${state.storageLoss || "0"} %/міс`
                                : `норми немає · ${state.storageLoss || "0"} %/міс`}
                        </span>
                      </div>
                    ))}
                  </div>
                  {lossTotal.tons > 0 && (
                    <p className="mt-2.5 border-t border-black/[.06] pt-2 text-[13.5px] font-semibold text-[#141414]">
                      Разом: {tons(lossTotal.tons)}
                      {lossTotal.uah > 0 ? ` ≈ ${uah(lossTotal.uah)} за очікуваними цінами` : ""}
                    </p>
                  )}
                </div>
              )}
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#8a8582]">
                Природні втрати маси рахуються за нормами Мінагрополітики (наказ № 316).
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!state.protectCost}
                  onChange={(e) => set({ protectCost: e.target.checked })}
                  className="mt-1 h-4 w-4 flex-none accent-[#8B1A2B]"
                />
                <span className="text-[14px] leading-snug text-[#3d3a38]">
                  Не продавати нижче собівартості, поки вистачає інших культур
                  <span className="mt-0.5 block text-[12.5px] text-[#8a8582]">
                    Потрібні витрати на 1 га. Гроші на вирощування вже витрачено, тож правило може зменшити загальний
                    прибуток — нижче буде видно, на скільки.
                  </span>
                </span>
              </label>
            </details>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24">
          <p className="px-1 text-[12px] leading-relaxed -mb-3 text-paper/50">
            Розрахунок довідковий. Очікувані ціни — прогноз, а не гарантія: якщо ціни не зростуть до очікуваних,
            недоотриманий дохід, показаний у розрахунку, не виникне. Рішення приймає господарство.
          </p>
          <Panel>
            <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-brand">Рекомендація</p>
            {!ready ? (
              <p className="mt-3 text-[15px] text-[#5f5b58]">Внесіть хоча б одну культуру з цінами і потрібну суму.</p>
            ) : (
              <>
                <div className="mt-3 flex flex-col gap-2.5">
                  {plan.lines.map((l) => (
                    <div key={l.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-heading text-[22px] font-extrabold text-[#141414] sm:text-[26px]">
                        <span className="text-brand">{l.name}</span>: продати {tons(l.tons)}
                      </p>
                      <p className="text-[14px] font-semibold text-[#5f5b58]">{uah(l.revenue)}</p>
                      {l.hectares !== undefined && l.lossPerHa !== undefined && (
                        <p className="w-full text-[13px] text-[#5f5b58]">
                          Це урожай з {hectaresFmt(l.hectares)} га
                          {l.lossPerHa > 0 ? ` · недоотримаєте ${uah(l.lossPerHa)} з кожного гектара` : ""}
                        </p>
                      )}
                      {l.belowCost && (
                        <p className="w-full text-[12.5px] text-[#8a8582]">
                          Ціна зараз нижча за собівартість тонни, але інші культури втратили б більше.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {!plan.feasible && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    Усього запасу за поточними цінами вистачає лише на {uah(plan.revenue)} — це менше за потрібну суму.
                  </p>
                )}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#f6f3f1] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8a8582]">Отримаєте зараз</p>
                    <p className="mt-1 font-heading text-[18px] font-bold text-[#141414]">{uah(plan.revenue)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f3f1] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#8a8582]">Недоотримаєте потім</p>
                    <p className="mt-1 font-heading text-[18px] font-bold text-brand">{uah(Math.max(0, plan.futureLoss))}</p>
                  </div>
                </div>
                {saving > 0.5 && worstAlt && (
                  <p className="mt-4 text-[14.5px] leading-relaxed text-[#3d3a38]">
                    Це на <b className="text-success">{uah(saving)}</b> менше втрат, ніж варіант «{worstAlt.label.toLowerCase()}».
                  </p>
                )}
                {creditBetter && result.creditCost !== null && (
                  <p className="mt-4 rounded-xl border border-success/30 bg-success/[.06] px-3.5 py-3 text-[14px] leading-relaxed text-[#2c4a37]">
                    Кредит на {uah(cash)} на {formatPrice(num(state.months))} міс коштуватиме ≈ {uah(result.creditCost)} — це
                    дешевше, ніж недоотримати {uah(plan.futureLoss)}, продаючи зерно зараз. Вигідніше позичити і продати
                    пізніше.
                  </p>
                )}
                {result.sellNowAnyway.length > 0 && (
                  <p className="mt-4 text-[13.5px] leading-relaxed text-[#5f5b58]">
                    {result.sellNowAnyway.join(", ")}: з урахуванням зберігання очікувана ціна не вища за поточну —
                    чекати немає сенсу, вигідніше продати зараз.
                  </p>
                )}
              </>
            )}
          </Panel>

          {ready && result.hectares.length === 0 && (
            <p className="rounded-[18px] border border-white/10 px-4 py-3.5 text-[13.5px] leading-relaxed text-paper/70">
              Внесіть «Витрати на 1 га» для культур — калькулятор покаже собівартість тонни, прибуток і рентабельність
              кожного гектара.
            </p>
          )}

          {ready && result.hectares.length > 0 && (
            <Panel title="Рентабельність 1 га">
              {(() => {
                const top = result.hectares[0];
                return (
                  <p className="text-[14.5px] leading-relaxed text-[#3d3a38]">
                    Найрентабельніший гектар за очікуваними цінами — <b>{top.name.toLowerCase()}</b>:{" "}
                    {uah(top.profitFuture)} прибутку з 1 га ({formatPct(top.marginFuturePct)}).
                  </p>
                );
              })()}
              <div className="mt-4 flex flex-col gap-3">
                {result.hectares.map((h) => (
                  <div key={h.id} className="rounded-2xl border border-[#ebe7e4] p-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="font-heading text-[15.5px] font-bold text-[#141414]">{h.name}</p>
                      <p className="text-[12.5px] text-[#8a8582]">
                        {formatPrice(h.areaHa)} га · собівартість 1 т {uah(h.costPerTon)}
                      </p>
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {[
                        { label: "Зараз", profit: h.profitNow, pctv: h.marginNowPct },
                        { label: "За прогнозом", profit: h.profitFuture, pctv: h.marginFuturePct },
                        { label: "За планом", profit: h.profitPlan, pctv: h.marginPlanPct },
                      ].map((x) => (
                        <div key={x.label} className="min-w-0 rounded-xl bg-[#f6f3f1] px-2.5 py-2">
                          <p className="text-[10.5px] font-semibold uppercase tracking-[.06em] text-[#8a8582]">{x.label}</p>
                          <p
                            className={cn(
                              "mt-0.5 text-[14px] font-bold",
                              x.profit < 0 ? "text-red-700" : "text-[#141414]"
                            )}
                          >
                            {formatPct(x.pctv)}
                          </p>
                          <p className="text-[11.5px] leading-tight text-[#5f5b58]">
                            {formatPrice(Math.round(x.profit))} <span className="whitespace-nowrap">грн/га</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {result.farmProfit !== null && (
                <p className="mt-4 text-[14px] leading-relaxed text-[#3d3a38]">
                  Прибуток усіх гектарів господарства за рекомендованим планом: <b>{uah(result.farmProfit)}</b>.
                  План підібрано так, щоб ця сума була найбільшою за потрібних {uah(cash)} зараз.
                </p>
              )}
              {result.costRule && (
                <p className="mt-3 rounded-xl bg-[#f6f3f1] px-3.5 py-3 text-[13.5px] leading-relaxed text-[#3d3a38]">
                  {state.protectCost
                    ? "Правило «не продавати нижче собівартості» увімкнене: воно коштує господарству "
                    : "Якщо увімкнути правило «не продавати нижче собівартості», господарство недоотримає ще "}
                  <b>{uah(result.costRule.withRule - result.costRule.withoutRule)}</b> майбутнього доходу (втрата{" "}
                  {uah(result.costRule.withRule)} проти {uah(result.costRule.withoutRule)} без нього).
                </p>
              )}
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#8a8582]">
                Рентабельність = прибуток з 1 га / витрати на 1 га. «За планом» — частина врожаю продана зараз, решта за
                очікуваною ціною.
              </p>
            </Panel>
          )}

          {ready && sorted.length > 0 && (
            <Panel title="Чому саме так">
              <p className="text-[14.5px] leading-relaxed text-[#3d3a38]">
                Кожна гривня, отримана зараз, коштує частину майбутнього доходу. Продавати варто ту культуру, де ця
                частка найменша
                {best && best.lossPerUah > 0
                  ? ` — ${best.name.toLowerCase()}: ${coef(best.lossPerUah)} грн майбутнього доходу за 1 грн зараз.`
                  : "."}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {sorted.map((c, i) => (
                  <div key={c.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className="font-semibold text-[#141414]">
                        {i + 1}. {c.name}
                      </span>
                      <span className="text-[#5f5b58]">
                        {c.lossPerUah > 0 ? `−${coef(c.lossPerUah)} грн за 1 грн` : `+${coef(-c.lossPerUah)} грн за 1 грн`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#efebe8]">
                      <div
                        className={cn("h-full rounded-full", i === 0 ? "bg-success" : "bg-brand/70")}
                        style={{ width: `${(Math.abs(c.lossPerUah) / maxLoss) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[12px] text-[#8a8582]">
                      {uah(c.priceNow)}/т зараз → {uah(c.netFuture)}/т потім · у {coef(c.ratio)} раза
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {ready && feasibleAlts.length > 1 && (
            <Panel title="Порівняння варіантів">
              <div className="flex flex-col divide-y divide-[#efebe8]">
                <div className="flex items-baseline justify-between gap-3 pb-2.5 text-[14px]">
                  <span className="font-semibold text-success">Рекомендований план</span>
                  <span className="font-semibold text-success">−{uah(Math.max(0, plan.futureLoss))}</span>
                </div>
                {result.alternatives.map((a) => (
                  <div key={a.label} className="flex items-baseline justify-between gap-3 py-2.5 text-[14px]">
                    <span className="text-[#3d3a38]">{a.label}</span>
                    <span className="text-[#5f5b58]">
                      {a.futureLoss === null ? "не вистачає запасу" : `−${uah(Math.max(0, a.futureLoss))}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#8a8582]">
                Сума — скільки майбутнього доходу господарство недоотримає, якщо збере {uah(cash)} цим способом.
                Якщо нічого не продавати зараз, увесь урожай у майбутньому коштуватиме ≈ {uah(result.holdAllFuture)};
                за рекомендованим планом разом вийде ≈ {uah(result.planTotal)}.
              </p>
            </Panel>
          )}

        </div>
      </div>
    </div>
  );
}
