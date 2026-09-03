"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import CartCheckoutForm from "./CartCheckoutForm";
import ImagePlaceholder from "./ImagePlaceholder";
import { productPhotoSrc } from "@/lib/product-images";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { lines, isOpen, close, setQuantity, remove, total, hasUnpriced } = useCart();

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
          // h-[100dvh], а не inset-0: на iOS Safari fixed-блок розтягується на
          // «великий» вьюпорт, і кнопка оформлення ховається під панеллю браузера
          className="fixed inset-x-0 top-0 z-[70] flex h-[100dvh] justify-end bg-black/70"
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.24, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Кошик"
            className="flex h-full w-full max-w-[440px] flex-col bg-card shadow-panelLg"
          >
            <div className="flex flex-none items-center justify-between border-b border-black/[.06] px-6 py-5">
              <h2 className="font-heading text-[17px] font-bold text-[#141414]">
                Кошик
                {lines.length > 0 && (
                  <span className="ml-2 font-sans text-[13px] font-medium text-[#8a8582]">
                    {lines.length} поз.
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Закрити кошик"
                className="grid h-8 w-8 place-items-center rounded-lg text-[#8a8582] transition-colors hover:bg-black/5 hover:text-[#141414]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-[15px] text-[#5f5b58]">Кошик поки порожній.</p>
                <Link
                  href="/products"
                  onClick={close}
                  className="rounded-[11px] bg-brand px-6 py-3.5 font-heading text-[14px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover"
                >
                  Перейти до каталогу
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <ul className="flex flex-col gap-4">
                    {lines.map((line) => {
                      const photo = productPhotoSrc(line.slug);
                      return (
                        <li
                          key={`${line.slug}__${line.packLabel}`}
                          className="flex gap-3.5 border-b border-black/[.06] pb-4 last:border-0 last:pb-0"
                        >
                          <Link
                            href={`/products/${line.slug}`}
                            onClick={close}
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
                              <ImagePlaceholder
                                label={line.product.slotLabel}
                                className="h-full w-full"
                                compact
                              />
                            )}
                          </Link>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-brand">
                              {line.product.brand}
                            </p>
                            <Link
                              href={`/products/${line.slug}`}
                              onClick={close}
                              className="mt-0.5 block font-heading text-[14.5px] font-bold leading-tight text-[#141414] hover:text-brand"
                            >
                              {line.product.name}
                            </Link>
                            <p className="mt-1 text-xs text-[#8a8582]">
                              Упаковка: {line.packLabel}
                            </p>

                            <div className="mt-2.5 flex items-center justify-between gap-3">
                              <div className="flex items-center rounded-[9px] border border-[#dcd8d5]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuantity(line.slug, line.packLabel, line.quantity - 1)
                                  }
                                  aria-label="Зменшити кількість"
                                  className="grid h-8 w-8 place-items-center text-[#5f5b58] transition-colors hover:text-brand"
                                >
                                  −
                                </button>
                                <span className="min-w-[28px] text-center font-heading text-[13.5px] font-bold text-[#141414]">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setQuantity(line.slug, line.packLabel, line.quantity + 1)
                                  }
                                  aria-label="Збільшити кількість"
                                  className="grid h-8 w-8 place-items-center text-[#5f5b58] transition-colors hover:text-brand"
                                >
                                  +
                                </button>
                              </div>

                              <p className="text-right font-heading text-[14px] font-bold text-brand">
                                {line.total === null
                                  ? "за запитом"
                                  : `${formatPrice(line.total)} грн`}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => remove(line.slug, line.packLabel)}
                            aria-label={`Прибрати ${line.product.name} з кошика`}
                            className="h-8 w-8 flex-none text-[#b9b4b0] transition-colors hover:text-red-600"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mx-auto">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex-none border-t border-black/[.06] px-6 py-5">
                  <div className="mb-4 flex items-baseline justify-between">
                    <span className="font-heading text-[15px] font-bold text-[#141414]">
                      Разом
                    </span>
                    <span className="font-heading text-xl font-extrabold text-brand">
                      {total > 0 ? `${formatPrice(total)} грн` : "за запитом"}
                    </span>
                  </div>
                  {hasUnpriced && total > 0 && (
                    <p className="mb-4 text-xs leading-relaxed text-[#8a8582]">
                      Позиції з ціною за запитом у суму не входять — менеджер
                      порахує їх під час підтвердження.
                    </p>
                  )}

                  <CartCheckoutForm />
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
