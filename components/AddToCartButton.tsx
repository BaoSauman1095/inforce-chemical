"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CartProvider";
import { cn } from "@/lib/utils";
import type { FlatCatalogItem } from "@/lib/types";

interface AddToCartButtonProps {
  product: FlatCatalogItem;
  packLabel?: string;
  variant?: "compact" | "full";
  className?: string;
}

const CONFIRM_MS = 2200;

export default function AddToCartButton({
  product,
  packLabel,
  variant = "full",
  className,
}: AddToCartButtonProps) {
  const { add, open } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const label = packLabel ?? product.packs[0]?.label;

  useEffect(() => {
    if (!justAdded) return;
    const id = window.setTimeout(() => setJustAdded(false), CONFIRM_MS);
    return () => window.clearTimeout(id);
  }, [justAdded]);

  useEffect(() => setJustAdded(false), [label]);

  if (!label) return null;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    add(product.slug, label!);
    setJustAdded(true);
    if (variant === "full") open();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={cn(
        "relative flex items-center justify-center gap-1.5 overflow-hidden font-heading font-bold tracking-wide text-white shadow-cta transition-colors",
        justAdded ? "bg-success hover:bg-success" : "bg-brand hover:bg-brand-hover",
        variant === "full"
          ? "rounded-[11px] px-6 py-3.5 text-[14px]"
          : "rounded-[9px] px-3.5 py-2.5 text-[13px]",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {justAdded ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
              <path d="M5 12.5l5 5 9-10" />
            </svg>
            Додано в кошик
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            Додати в кошик
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
