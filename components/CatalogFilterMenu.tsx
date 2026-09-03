"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/lib/useOnClickOutside";

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
}

interface Props {
  /** Підпис і значення для пункту «усі» — воно ж стан без фільтра. */
  allLabel: string;
  options: FilterOption[];
  value: string;
  onChange: (next: string) => void;
  open: boolean;
  /** Меню відкриваються по черзі, тому станом володіє каталог. */
  onToggle: (next: boolean) => void;
  /**
   * До якого краю кнопки притискати меню. Ряд фільтрів на телефоні вужчий за
   * два меню, тож ліве тримаємо зліва, а праве — справа: інакше одне з них
   * вилазить за екран.
   */
  align?: "left" | "right";
}

/**
 * Випадний фільтр каталогу (бренд, культура). Виглядає інакше за плитки
 * категорій: фірмова рамка замість білої плитки, а коли значення обране —
 * суцільна заливка. Так видно, що це керування, а не ще одна категорія.
 */
export default function CatalogFilterMenu({
  allLabel,
  options,
  value,
  onChange,
  open,
  onToggle,
  align = "left",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => onToggle(false));

  // На невисоких екранах меню відкривається нижче краю вікна — підтягуємо
  // сторінку рівно настільки, щоб воно вмістилося цілком.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(
      () => menuRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      160
    );
    return () => window.clearTimeout(id);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative flex-none" ref={ref}>
      <button
        type="button"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-brand py-2.5 pl-4 pr-3.5 font-heading text-[13.5px] font-bold tracking-wide transition-colors",
          selected
            ? "bg-brand text-white shadow-cta"
            : "bg-brand/[.14] text-paper hover:bg-brand/[.24]"
        )}
      >
        {selected?.icon && <span className="text-base leading-none">{selected.icon}</span>}
        {selected?.label ?? allLabel}
        <span className={cn("text-[10px] transition-transform", open && "rotate-180")}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            // z-45 — вище за нижню кнопку дзвінка (z-40), яка інакше накриває
            // останні пункти меню на телефоні, але нижче за липку шапку (z-50).
            className={cn(
              "absolute top-[calc(100%+8px)] z-[45] max-h-[280px] min-w-[220px] overflow-y-auto rounded-xl bg-card p-1.5 shadow-panelLg",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {[{ value: "all", label: allLabel } as FilterOption, ...options].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  onToggle(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors",
                  value === o.value
                    ? "bg-brand text-white"
                    : "text-[#141414] hover:bg-[#f3eff0]"
                )}
              >
                {o.icon && <span className="text-base leading-none">{o.icon}</span>}
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
