"use client";

import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "./ImagePlaceholder";
import { productPhotoSrc } from "@/lib/product-images";
import { formatPrice } from "@/lib/utils";
import type { CartLine } from "./CartProvider";

interface CartLineRowProps {
  line: CartLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onNavigate: () => void;
}

/** Одна позиція в списку кошика: фото, назва, кількість, сума. */
export default function CartLineRow({
  line,
  onQuantity,
  onRemove,
  onNavigate,
}: CartLineRowProps) {
  const photo = productPhotoSrc(line.slug);

  return (
    <li className="flex gap-3.5 border-b border-black/[.06] pb-4 last:border-0 last:pb-0">
      <Link
        href={`/products/${line.slug}`}
        onClick={onNavigate}
        className="relative h-[68px] w-[68px] flex-none overflow-hidden rounded-xl bg-white"
      >
        {photo ? (
          <Image
            src={photo}
            alt={line.product.name}
            fill
            sizes="68px"
            className="object-contain p-1.5"
          />
        ) : (
          <ImagePlaceholder label={line.product.slotLabel} className="h-full w-full" compact />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-brand">
          {line.product.brand}
        </p>
        <Link
          href={`/products/${line.slug}`}
          onClick={onNavigate}
          className="mt-0.5 block font-heading text-[14.5px] font-bold leading-tight text-[#141414] hover:text-brand"
        >
          {line.product.name}
        </Link>
        <p className="mt-1 text-xs text-[#8a8582]">Упаковка: {line.packLabel}</p>

        <div className="mt-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-[9px] border border-[#dcd8d5]">
            <button
              type="button"
              onClick={() => onQuantity(line.quantity - 1)}
              aria-label="Зменшити кількість"
              className="tap-44 grid h-8 w-8 place-items-center text-[#5f5b58] transition-colors hover:text-brand"
            >
              −
            </button>
            <span className="min-w-[28px] text-center font-heading text-[13.5px] font-bold text-[#141414]">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantity(line.quantity + 1)}
              aria-label="Збільшити кількість"
              className="tap-44 grid h-8 w-8 place-items-center text-[#5f5b58] transition-colors hover:text-brand"
            >
              +
            </button>
          </div>

          <p className="text-right font-heading text-[14px] font-bold text-brand">
            {line.total === null ? "за запитом" : `${formatPrice(line.total)} грн`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Прибрати ${line.product.name} з кошика`}
        className="tap-44 h-8 w-8 flex-none text-[#b9b4b0] transition-colors hover:text-red-600"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="mx-auto"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </li>
  );
}
