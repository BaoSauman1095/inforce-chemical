"use client";

import { useCart } from "./CartProvider";

/** Іконка кошика в шапці з лічильником позицій. */
export default function CartButton({ className = "" }: { className?: string }) {
  const { count, open, ready } = useCart();

  return (
    <button
      type="button"
      onClick={open}
      aria-label={count > 0 ? `Кошик, позицій: ${count}` : "Кошик"}
      className={`relative grid h-10 w-10 flex-none place-items-center rounded-lg border border-white/15 text-paper transition-colors hover:border-white/35 ${className}`}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6" />
        <circle cx="9.5" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
      </svg>

      {/* До читання localStorage лічильника немає — інакше на сервері й
          клієнті вийде різна розмітка і React вилає гідратацію. */}
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-brand px-1 font-heading text-[11px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
