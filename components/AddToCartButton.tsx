"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { cn } from "@/lib/utils";
import type { FlatCatalogItem } from "@/lib/types";

interface AddToCartButtonProps {
  product: FlatCatalogItem;
  /** Яку упаковку класти в кошик. За замовчуванням — перша. */
  packLabel?: string;
  /** `compact` — для картки в каталозі, `full` — для сторінки товару. */
  variant?: "compact" | "full";
  className?: string;
}

export default function AddToCartButton({
  product,
  packLabel,
  variant = "full",
  className,
}: AddToCartButtonProps) {
  const { add, open } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const label = packLabel ?? product.packs[0]?.label;

  // Підтвердження «Додано» саме зникає — таймер знімаємо, щоб не чіпати
  // стан уже розмонтованої картки під час фільтрації каталогу.
  useEffect(() => {
    if (!justAdded) return;
    const id = window.setTimeout(() => setJustAdded(false), 1600);
    return () => window.clearTimeout(id);
  }, [justAdded]);

  if (!label) return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    add(product.slug, label!);
    if (variant === "full") {
      open();
    } else {
      setJustAdded(true);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "rounded-[11px] bg-brand font-heading font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover",
        variant === "full"
          ? "px-6 py-3.5 text-[14px]"
          : "rounded-[9px] px-3.5 py-2.5 text-[13px]",
        className
      )}
    >
      {justAdded ? "Додано ✓" : "Додати в кошик"}
    </button>
  );
}
