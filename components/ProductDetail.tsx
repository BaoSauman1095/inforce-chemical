"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumbs from "./Breadcrumbs";
import ProductGallery from "./ProductGallery";
import ProductActions from "./ProductActions";
import RelatedProducts from "./RelatedProducts";
import { cn, formatPrice, isFlatPackPrice } from "@/lib/utils";
import { cropIcon } from "@/lib/crop-icons";
import type { FlatCatalogItem } from "@/lib/types";

interface ProductDetailProps {
  product: FlatCatalogItem;
  related: FlatCatalogItem[];
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#8a8582]">{label}</p>
      <p className="mt-1 text-[14.5px] font-bold text-[#141414]">{value}</p>
    </div>
  );
}

export default function ProductDetail({ product, related }: ProductDetailProps) {
  const [packIndex, setPackIndex] = useState(0);
  const selectedPack = product.packs[packIndex];

  const specRows = [
    product.activeIngredient && { label: "Діюча речовина", value: product.activeIngredient },
    product.formulationType && { label: "Препаративна форма", value: product.formulationType },
    product.chemicalClass && { label: "Хімічний клас", value: product.chemicalClass },
    ...(product.specs ?? []),
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 pt-6 md:px-7">
      <Breadcrumbs
        items={[
          { label: "Головна", href: "/" },
          { label: "Каталог", href: "/products" },
          { label: product.group },
        ]}
      />

      <div className="mb-5 flex items-baseline gap-4">
        <h1 className="font-heading text-[28px] font-extrabold tracking-tight sm:text-[36px] md:text-[44px]">
          {product.name}
        </h1>
        <span className="h-px flex-1 bg-white/[.12]" />
      </div>

      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-paper/60 transition-colors hover:text-paper"
      >
        ← Назад до каталогу
      </Link>

      <div className="grid grid-cols-1 gap-8 rounded-[24px] bg-card p-6 shadow-panelLg sm:p-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery name={product.name} slug={product.slug} images={product.images} />

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.15em] text-brand">{product.brand}</p>
          <h2 className="mt-1.5 font-heading text-[26px] font-extrabold text-[#141414]">{product.name}</h2>

          {product.packs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.packs.map((pack, i) => (
                <button
                  key={pack.label}
                  type="button"
                  onClick={() => setPackIndex(i)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
                    i === packIndex ? "bg-brand text-white" : "bg-brand/[.08] text-brand hover:bg-brand/[.16]"
                  )}
                >
                  {pack.label}
                </button>
              ))}
            </div>
          )}

          {selectedPack?.price ? (
            <p className="mt-4 font-heading text-2xl font-extrabold text-brand">
              {formatPrice(selectedPack.price)} грн
              {!isFlatPackPrice(selectedPack.label, product.unit) && `/${product.unit}`}
            </p>
          ) : (
            <p className="mt-4 font-heading text-lg font-semibold text-[#8a8582]">Ціна за запитом</p>
          )}

          {product.tagline && (
            <p className="mt-4 font-heading text-[17px] font-bold text-[#141414]">{product.tagline}</p>
          )}
          {product.description && (
            <p className="mt-2 text-[15px] leading-relaxed text-[#5f5b58]">{product.description}</p>
          )}

          {specRows.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {specRows.map((spec) => (
                <Spec key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </div>
          )}

          {product.crops && product.crops.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[.15em] text-[#8a8582]">
                Культури
              </p>
              <div className="flex flex-wrap gap-2">
                {product.crops.map((crop) => (
                  <span
                    key={crop}
                    className="flex items-center gap-1.5 rounded-full border border-[#e4e0dd] px-3.5 py-1.5 text-[13px] font-semibold text-[#141414]"
                  >
                    <span aria-hidden="true">{cropIcon(crop)}</span>
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.advantages && product.advantages.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[.15em] text-[#8a8582]">
                Переваги
              </p>
              <ul className="flex flex-col gap-1.5">
                {product.advantages.map((advantage) => (
                  <li key={advantage} className="flex gap-2 text-[14.5px] leading-relaxed text-[#3d3a38]">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-brand" />
                    {advantage}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ProductActions product={product} packLabel={selectedPack?.label} />
        </div>
      </div>

      {product.fullDescription && (
        <div className="mt-8 rounded-[24px] bg-card p-6 shadow-panel sm:p-8">
          <h2 className="font-heading text-xl font-bold text-[#141414]">Опис товару</h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#5f5b58]">
            {product.fullDescription}
          </p>
        </div>
      )}

      {product.dosage && product.dosage.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-[24px] bg-card p-6 shadow-panel sm:p-8">
          <h2 className="font-heading text-xl font-bold text-[#141414]">
            Норми витрат і спосіб застосування
          </h2>
          <table className="mt-4 w-full min-w-[560px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-[.1em] text-[#8a8582]">
                <th className="py-2.5 pr-4 font-semibold">Культура</th>
                <th className="py-2.5 pr-4 font-semibold">Спектр дії</th>
                <th className="py-2.5 pr-4 font-semibold">Норма витрат</th>
                <th className="py-2.5 font-semibold">Час обробки</th>
              </tr>
            </thead>
            <tbody>
              {product.dosage.map((row) => (
                <tr key={row.crop} className="border-b border-black/5 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-[#141414]">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true">{cropIcon(row.crop)}</span>
                      {row.crop}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#5f5b58]">{row.spectrum}</td>
                  <td className="py-3 pr-4 font-semibold text-brand">{row.rate}</td>
                  <td className="py-3 text-[#5f5b58]">{row.timing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RelatedProducts items={related} />
    </section>
  );
}
