"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ImagePlaceholder from "./ImagePlaceholder";
import { cn, formatPrice } from "@/lib/utils";
import type { FlatCatalogItem } from "@/lib/types";

export default function ProductCard({ item }: { item: FlatCatalogItem }) {
  const [packIndex, setPackIndex] = useState(0);
  const selectedPack = item.packs[packIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-panel"
    >
      <ImagePlaceholder label={item.slotLabel} className="h-[150px]" />

      <div className="flex flex-1 flex-col px-[18px] pb-[18px] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-brand">
          {item.brand}
        </p>
        <p className="mt-1.5 font-heading text-base font-bold leading-tight text-[#141414]">
          {item.name}
        </p>

        <div className="mt-2.5 flex flex-wrap gap-[5px]">
          {item.packs.map((pack, i) => (
            <button
              key={pack.label}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setPackIndex(i);
              }}
              className={cn(
                "whitespace-nowrap rounded-md px-[9px] py-1 text-[11px] font-semibold transition-colors",
                i === packIndex ? "bg-brand text-white" : "bg-brand/[.08] text-brand hover:bg-brand/[.16]"
              )}
            >
              {pack.label}
            </button>
          ))}
        </div>

        {selectedPack?.price ? (
          <p className="mt-3 font-heading text-[15px] font-bold text-brand">
            {formatPrice(selectedPack.price)} грн/{item.unit}
          </p>
        ) : (
          <p className="mt-3 font-heading text-[13.5px] font-semibold text-[#8a8582]">
            Ціна за запитом
          </p>
        )}

        <Link
          href={`/products/${item.slug}`}
          className="mt-2.5 rounded-[9px] border border-brand px-3.5 py-2.5 text-center font-heading text-[13px] font-bold tracking-wide text-brand transition-colors hover:bg-brand hover:text-white"
        >
          Детальніше
        </Link>
      </div>
    </motion.div>
  );
}
