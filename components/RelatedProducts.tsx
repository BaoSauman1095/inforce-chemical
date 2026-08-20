import Link from "next/link";
import ImagePlaceholder from "./ImagePlaceholder";
import { formatPrice } from "@/lib/utils";
import type { FlatCatalogItem } from "@/lib/types";

export default function RelatedProducts({ items }: { items: FlatCatalogItem[] }) {
  if (!items.length) return null;

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-baseline gap-4">
        <h2 className="font-heading text-xl font-bold text-paper">Схожі товари</h2>
        <span className="h-px flex-1 bg-white/[.12]" />
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-panel transition-transform hover:-translate-y-0.5"
          >
            <ImagePlaceholder label={`фото — ${item.name}`} className="h-[130px]" />
            <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-brand">
                {item.brand}
              </p>
              <p className="mt-1.5 font-heading text-[14.5px] font-bold leading-tight text-[#141414]">
                {item.name}
              </p>
              {item.packs[0]?.price ? (
                <p className="mt-2 font-heading text-[14px] font-bold text-brand">
                  {formatPrice(item.packs[0].price)} грн/{item.unit}
                </p>
              ) : (
                <p className="mt-2 font-heading text-[12.5px] font-semibold text-[#8a8582]">
                  Ціна за запитом
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
