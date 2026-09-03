"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import CatalogFilterMenu from "./CatalogFilterMenu";
import { CATALOG, CATALOG_TABS } from "@/lib/catalog-data";
import { CROP_FILTERS, itemCropSources, matchesCrop } from "@/lib/crops";
import { findTabForBrand } from "@/lib/products";
import { cn } from "@/lib/utils";
import type { CatalogTab, FlatCatalogItem } from "@/lib/types";

const PAGE_SIZE = 12;

function CatalogInner() {
  const [tab, setTab] = useState<CatalogTab>("seeds");
  const [brand, setBrand] = useState("all");
  const [crop, setCrop] = useState("all");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openMenu, setOpenMenu] = useState<"brand" | "crop" | null>(null);

  // Клік по логотипу партнера веде на /?brand=<бренд>#catalog — звідси
  // підхоплюємо бренд, перемикаємось на його вкладку й прокручуємось сюди.
  const searchParams = useSearchParams();
  const brandParam = searchParams.get("brand");

  useEffect(() => {
    if (!brandParam) return;
    const target = findTabForBrand(brandParam);
    if (!target) return;

    setTab(target);
    setBrand(brandParam);
    setGroup("all");
    setQuery("");
    setVisible(PAGE_SIZE);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  }, [brandParam]);

  const groups = CATALOG[tab];

  const brands = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => g.items.forEach((it) => set.add(it.brand)));
    return Array.from(set);
  }, [groups]);

  // На вкладці «Насіння» культура — це і є категорія (Соняшник, Кукурудза),
  // тож окремий фільтр там лише дублював би плитки. Показуємо його для
  // добрив і ЗЗР, де культура не пов'язана з категорією препарату.
  const cropsEnabled = tab !== "seeds";

  // Лишаємо в списку тільки ті культури, для яких на вкладці є позиції —
  // щоб вибір не приводив у порожній каталог.
  const cropOptions = useMemo(() => {
    if (!cropsEnabled) return [];
    return CROP_FILTERS.filter((c) =>
      groups.some((g) => g.items.some((it) => matchesCrop(itemCropSources(it, g.title), c)))
    ).map((c) => ({ value: c.key, label: c.label, icon: c.icon }));
  }, [groups, cropsEnabled]);

  const activeCrop =
    cropsEnabled && crop !== "all" ? CROP_FILTERS.find((c) => c.key === crop) : undefined;

  // Категорії ховаємо разом із культурою: «Фуміганти» для соняшнику — це
  // порожній результат, тож плитки, що нікуди не ведуть, краще не показувати.
  const groupTitles = useMemo(
    () =>
      groups
        .filter((g) =>
          g.items.some(
            (it) => !activeCrop || matchesCrop(itemCropSources(it, g.title), activeCrop)
          )
        )
        .map((g) => g.title),
    [groups, activeCrop]
  );

  const allItems: FlatCatalogItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: FlatCatalogItem[] = [];

    groups.forEach((g) => {
      if (group !== "all" && g.title !== group) return;
      g.items.forEach((it) => {
        if (brand !== "all" && it.brand !== brand) return;
        if (activeCrop && !matchesCrop(itemCropSources(it, g.title), activeCrop)) return;
        if (q && !`${it.name} ${it.brand}`.toLowerCase().includes(q)) return;
        out.push({
          ...it,
          group: g.title,
          icon: g.icon,
          tab,
          slotLabel: `фото — ${it.name}`,
        });
      });
    });

    return out;
  }, [groups, group, brand, activeCrop, query, tab]);

  const items = allItems.slice(0, visible);
  const hasMore = allItems.length > items.length;

  function selectTab(next: CatalogTab) {
    setTab(next);
    setBrand("all");
    setGroup("all");
    setQuery("");
    setVisible(PAGE_SIZE);
    // Культуру навмисно не скидаємо: бренди й категорії в кожній вкладці свої,
    // а культура та сама, тож господарство, що вирощує соняшник, перемикається
    // з добрив на ЗЗР і не набирає фільтр заново.
  }

  function selectCrop(next: string) {
    setCrop(next);
    setVisible(PAGE_SIZE);

    // Обрана категорія може не мати позицій для нової культури — тоді її
    // плитка зникне, а фільтр лишиться й покаже порожній каталог.
    const target = CROP_FILTERS.find((c) => c.key === next);
    const stillHasItems =
      group === "all" ||
      !target ||
      groups.some(
        (g) =>
          g.title === group &&
          g.items.some((it) => matchesCrop(itemCropSources(it, g.title), target))
      );
    if (!stillHasItems) setGroup("all");
  }

  function selectBrand(next: string) {
    setBrand(next);
    // Плитки «Усі категорії» більше немає: повернення до всіх позицій вкладки
    // виконує саме фільтр брендів, тож він скидає й вибрану категорію.
    setGroup("all");
    setVisible(PAGE_SIZE);
  }

  function selectGroup(next: string) {
    setGroup(next);
    setVisible(PAGE_SIZE);
  }

  function resetFilters() {
    setBrand("all");
    setCrop("all");
    setGroup("all");
    setQuery("");
    setVisible(PAGE_SIZE);
  }

  return (
    <section
      id="catalog"
      className="mx-auto max-w-[1240px] scroll-mt-[90px] px-5 pb-24 md:px-7"
    >
      <div className="mb-6 flex items-baseline gap-4">
        <h2 className="font-heading text-[28px] font-extrabold tracking-tight sm:text-[36px] md:text-[44px]">
          Каталог продукції
        </h2>
        <span className="h-px flex-1 bg-white/[.12]" />
      </div>
      <p className="-mt-2 mb-6 max-w-[660px] text-base leading-relaxed text-paper/[.62]">
        Понад 300 позицій у наявності.
      </p>

      {/* Вкладки й пошук — один виділений блок: це головний вибір на сторінці. */}
      <div className="mb-4 rounded-[22px] border border-brand/40 bg-brand/[.10] p-2.5 shadow-[0_0_0_1px_rgba(139,26,43,.14),0_18px_40px_-24px_rgba(139,26,43,.8)]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
          <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-none">
            {CATALOG_TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectTab(t.key)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3.5 font-heading text-[13px] font-bold leading-tight tracking-wide transition-colors sm:px-6 sm:text-[15px] lg:min-w-[126px]",
                    active
                      ? "bg-brand text-white shadow-cta"
                      : "bg-white/[.06] text-paper/[.75] hover:bg-white/[.12] hover:text-paper"
                  )}
                >
                  <span aria-hidden="true" className="text-[26px] leading-none sm:text-[30px]">
                    {t.icon}
                  </span>
                  <span className="sm:hidden">{t.shortLabel ?? t.label}</span>
                  <span className="hidden text-center sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Пошук по назві або бренду"
            className="w-full flex-1 rounded-2xl border border-white/[.12] bg-ink/60 px-[18px] py-4 text-[15px] text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-brand/70"
          />
        </div>
      </div>

      {/* Бренди, культура й категорії — один ряд фільтрів. Випадні списки
          першими: саме вони повертають до всіх позицій вкладки. */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <CatalogFilterMenu
          allLabel="Всі бренди"
          options={brands.map((b) => ({ value: b, label: b }))}
          value={brand}
          onChange={selectBrand}
          open={openMenu === "brand"}
          onToggle={(next) => setOpenMenu(next ? "brand" : null)}
        />

        {cropsEnabled && (
          <CatalogFilterMenu
            allLabel="Всі культури"
            options={cropOptions}
            value={crop}
            onChange={selectCrop}
            open={openMenu === "crop"}
            onToggle={(next) => setOpenMenu(next ? "crop" : null)}
            align="right"
          />
        )}

        <span className="hidden h-7 w-px flex-none bg-white/15 sm:block" />

        {groupTitles.map((g) => {
          const active = group === g;
          const gr = groups.find((x) => x.title === g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => selectGroup(g)}
              className={cn(
                "flex items-center gap-2 rounded-full border py-2.5 pl-4 pr-5 font-heading text-[13.5px] font-bold tracking-wide transition-colors",
                active
                  ? "border-brand bg-brand text-white"
                  : "border-paper/50 bg-card text-[#141414] hover:border-paper"
              )}
            >
              <span className="text-base">{gr?.icon ?? "•"}</span>
              {g}
            </button>
          );
        })}
      </div>

      <div
        key={`${tab}-${group}-${brand}-${crop}-${query}`}
        className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {items.map((item) => (
          <ProductCard key={`${item.group}-${item.brand}-${item.name}`} item={item} />
        ))}
      </div>

      {!items.length && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-[15px] text-paper/55">
            Нічого не знайдено. Спробуйте іншу назву або зателефонуйте — підберемо аналог.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-white/20 px-3.5 py-2 text-[13px] font-semibold text-paper/80 transition-colors hover:border-brand hover:text-paper"
          >
            Скинути фільтри
          </button>
        </div>
      )}

      {hasMore && (
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-xl border border-white/[.22] px-8 py-3.5 font-heading text-sm font-bold tracking-wide text-paper transition-colors hover:border-brand hover:bg-brand/[.12]"
          >
            Показати ще
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * useSearchParams (фільтр «/?brand=…» з блоку партнерів) вимагає межі
 * Suspense на статичних сторінках. Тримаємо її тут, а не в кожній сторінці,
 * що рендерить каталог — інакше про неї легко забути.
 */
export default function Catalog() {
  return (
    <Suspense>
      <CatalogInner />
    </Suspense>
  );
}
