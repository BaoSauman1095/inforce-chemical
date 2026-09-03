"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import CartCheckoutForm from "./CartCheckoutForm";
import CartLineRow from "./CartLineRow";
import { formatPrice } from "@/lib/utils";

/**
 * Крок панелі. Оформлення винесене на окремий екран, щоб на телефоні список
 * позицій отримав усю висоту: форма внизу з'їдала близько 40% екрана, і на
 * список лишалось вікно під 2–3 картки.
 */
type Step = "cart" | "checkout" | "done";

export default function CartDrawer() {
  const { lines, isOpen, close, setQuantity, remove, clear, total, hasUnpriced } =
    useCart();
  const [step, setStep] = useState<Step>("cart");

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

  // Закрили панель — наступного разу відкриваємо зі списку, а не з форми
  // чи подяки. Скидаємо після анімації виходу, щоб крок не блимав.
  useEffect(() => {
    if (isOpen) return;
    const id = window.setTimeout(() => setStep("cart"), 300);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  const title = step === "checkout" ? "Оформлення" : "Кошик";

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
          // «великий» вьюпорт, і низ панелі ховається під панеллю браузера
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
              <h2 className="flex items-baseline font-heading text-[17px] font-bold text-[#141414]">
                {title}
                {step === "cart" && lines.length > 0 && (
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

            {step === "done" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l5 5 9-10" />
                  </svg>
                </span>
                <div>
                  <p className="font-heading text-[19px] font-bold text-[#141414]">
                    Замовлення прийнято
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5f5b58]">
                    Менеджер зв&apos;яжеться з вами найближчим часом, щоб
                    підтвердити склад замовлення та умови доставки.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="mt-1 rounded-[11px] bg-brand px-6 py-3.5 font-heading text-[14px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover"
                >
                  Продовжити покупки
                </button>
              </div>
            ) : lines.length === 0 ? (
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
            ) : step === "cart" ? (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <ul className="flex flex-col gap-4">
                    {lines.map((line) => (
                      <CartLineRow
                        key={`${line.slug}__${line.packLabel}`}
                        line={line}
                        onQuantity={(q) => setQuantity(line.slug, line.packLabel, q)}
                        onRemove={() => remove(line.slug, line.packLabel)}
                        onNavigate={close}
                      />
                    ))}
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

                  <button
                    type="button"
                    onClick={() => setStep("checkout")}
                    className="flex w-full items-center justify-center rounded-[11px] bg-brand px-6 py-4 font-heading text-[15px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover"
                  >
                    Оформити замовлення
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-opacity hover:opacity-70"
                >
                  ← Назад до кошика
                </button>

                <div className="mb-5 rounded-xl bg-black/[.03] px-4 py-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-[#5f5b58]">
                      {lines.length} поз., {lines.reduce((s, l) => s + l.quantity, 0)} уп.
                    </span>
                    <span className="font-heading text-[17px] font-extrabold text-brand">
                      {total > 0 ? `${formatPrice(total)} грн` : "за запитом"}
                    </span>
                  </div>
                  {hasUnpriced && total > 0 && (
                    <p className="mt-1.5 text-xs leading-relaxed text-[#8a8582]">
                      Без позицій за запитом — їх порахує менеджер.
                    </p>
                  )}
                </div>

                <CartCheckoutForm
                  lines={lines}
                  onOrdered={() => {
                    clear();
                    setStep("done");
                  }}
                />
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
