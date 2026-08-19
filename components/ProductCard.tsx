"use client";

import { motion } from "framer-motion";
import ImagePlaceholder from "./ImagePlaceholder";
import { formatPrice } from "@/lib/utils";
import type { FlatCatalogItem } from "@/lib/types";

export default function ProductCard({ item }: { item: FlatCatalogItem }) {
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
          {item.packs.map((pack) => (
            <span
              key={pack}
              className="whitespace-nowrap rounded-md bg-brand/[.08] px-[9px] py-1 text-[11px] font-semibold text-brand"
            >
              {pack}
            </span>
          ))}
        </div>

        {item.price ? (
          <p className="mt-3 font-heading text-[15px] font-bold text-brand">
            {item.packs.length > 1 ? "від " : ""}
            {formatPrice(item.price)} грн/{item.unit}
          </p>
        ) : (
          <p className="mt-3 font-heading text-[13.5px] font-semibold text-[#8a8582]">
            Ціна за запитом
          </p>
        )}

        <a
          href="#contacts"
          className="mt-2.5 rounded-[9px] border border-brand px-3.5 py-2.5 text-center font-heading text-[13px] font-bold tracking-wide text-brand transition-colors hover:bg-brand hover:text-white"
        >
          Детальніше
        </a>
      </div>
    </motion.div>
  );
}
