"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { CATALOG, CATALOG_TABS } from "@/lib/catalog-data";
import { cn } from "@/lib/utils";
import type { CatalogTab, FlatCatalogItem } from "@/lib/types";
import { useOnClickOutside } from "@/lib/useOnClickOutside";

const PAGE_SIZE = 12;

export default function Catalog() {
  const [tab, setTab] = useState<CatalogTab>("seeds");
  const [brand, setBrand] = useState("all");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setBrandMenuOpen(false));

  const groups = CATALOG[tab];

  const groupTitles = useMemo(
    () => groups.filter((g) => g.items.length > 0).map((g) => g.title),
    [groups]
  );

  const brands = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => g.items.forEach((it) => set.add(it.brand)));
    return Array.from(set);
  }, [groups]);

  const allItems: FlatCatalogItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: FlatCatalogItem[] = [];

    groups.forEach((g) => {
      if (group !== "all" && g.title !== group) return;
      g.items.forEach((it) => {
        if (brand !== "all" && it.brand !== brand) return;
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
  }, [groups, group, brand, query, tab]);

  const items = allItems.slice(0, visible);
  const hasMore = allItems.length > items.length;

  function selectTab(next: CatalogTab) {
    setTab(next);
    setBrand("all");
    setGroup("all");
    setQuery("");
    setVisible(PAGE_SIZE);
  }

  function setFilter(patch: Partial<{ brand: string; group: string }>) {
    if (patch.brand !== undefined) setBrand(patch.brand);
    if (patch.group !== undefined) setGroup(patch.group);
    setVisible(PAGE_SIZE);
  }

  function resetFilters() {
    setBrand("all");
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
        Понад 300 позицій у наявності. Однакові препарати зібрані в одну
        позицію — фасування вказано поруч.
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-3.5">
        <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-white/[.08] bg-white/5 p-1.5">
          {CATALOG_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                className={cn(
                  "rounded-xl px-[22px] py-2.5 font-heading text-sm font-semibold tracking-wide transition-colors",
                  active ? "bg-brand text-white" : "text-paper/[.66] hover:text-paper"
                )}
              >
                {t.label}
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
          className="min-w-[220px] flex-1 rounded-xl border border-white/[.14] bg-white/[.04] px-[18px] py-3.5 text-[15px] text-paper outline-none placeholder:text-paper/40 focus:border-brand"
        />

        <div className="relative flex-none" ref={menuRef}>
          <button
            type="button"
            onClick={() => setBrandMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 whitespace-nowrap rounded-xl border border-white/[.14] bg-white/[.04] px-4 py-3.5 font-heading text-sm font-semibold text-paper"
          >
            {brand === "all" ? "Всі бренди" : brand}
            <span className="text-[11px] text-paper/50">▾</span>
          </button>

          <AnimatePresence>
            {brandMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] z-30 max-h-[280px] min-w-[220px] overflow-y-auto rounded-xl bg-card p-1.5 shadow-panelLg"
              >
                {["all", ...brands].map((b) => {
                  const active = brand === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setFilter({ brand: b });
                        setBrandMenuOpen(false);
                      }}
                      className={cn(
                        "block w-full rounded-lg px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
                        active ? "bg-brand text-white" : "text-[#141414] hover:bg-[#f3eff0]"
                      )}
                    >
                      {b === "all" ? "Всі бренди" : b}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        {["all", ...groupTitles].map((g) => {
          const active = group === g;
          const gr = groups.find((x) => x.title === g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => setFilter({ group: g })}
              className={cn(
                "flex items-center gap-2 rounded-full border py-2.5 pl-4 pr-5 font-heading text-[13.5px] font-bold tracking-wide transition-colors",
                active
                  ? "border-brand bg-brand text-white"
                  : "border-paper/50 bg-card text-[#141414] hover:border-paper"
              )}
            >
              <span className="text-base">{g === "all" ? "▦" : gr?.icon ?? "•"}</span>
              {g === "all" ? "Усі категорії" : g}
            </button>
          );
        })}
      </div>

      <div
        key={`${tab}-${group}-${brand}-${query}`}
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
