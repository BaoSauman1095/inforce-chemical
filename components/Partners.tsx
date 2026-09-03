"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { partnerLogoSrc } from "@/lib/partner-logos";
import { CATALOG_BRANDS } from "@/lib/products";

const PARTNERS = [
  { name: "Limagrain", role: "Насіння" },
  { name: "Ocean Invest", role: "Захист рослин" },
  { name: "Biolchim", role: "Добрива" },
  { name: "Holland Farming", role: "Біостимулятори" },
  { name: "Apsov", role: "Насіння" },
  { name: "Farmsaat", role: "Насіння" },
  { name: "Himagro M", role: "Захист рослин" },
  { name: "Sumi Agro", role: "Захист рослин" },
];

const FEATURES = [
  {
    title: "Власна агрономічна служба",
    icon: (
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z M9 12l2 2 4-4" />
    ),
  },
  {
    title: "Доставка по Україні",
    icon: (
      <>
        <path d="M3 16V6a1 1 0 0 1 1-1h9v11" />
        <path d="M13 10h4l4 4v2h-2" />
        <circle cx="7.5" cy="17.5" r="2" />
        <circle cx="17.5" cy="17.5" r="2" />
      </>
    ),
  },
  {
    title: "Партнерство з банками — 0% на 7 місяців",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </>
    ),
  },
];

/**
 * Логотип партнера з `public/partners/`. Поки файлу немає (або він не
 * завантажився) — показуємо назву текстом, як було до появи логотипів.
 */
function PartnerLogo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const src = partnerLogoSrc(name);

  if (!src || failed) {
    return (
      <div className="grid h-16 w-full place-items-center font-heading text-lg font-extrabold tracking-wide text-brand">
        {name}
      </div>
    );
  }

  return (
    <div className="relative h-16 w-full">
      <Image
        src={src}
        alt={name}
        fill
        sizes="(min-width: 768px) 280px, 45vw"
        className="object-contain px-2"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function Partners() {
  const router = useRouter();

  return (
    <section
      id="partners"
      className="mx-auto max-w-[1240px] scroll-mt-[90px] px-5 pb-24 md:px-7"
    >
      <div className="mb-7 flex items-baseline gap-4">
        <h2 className="font-heading text-[28px] font-extrabold tracking-tight sm:text-[36px] md:text-[44px]">
          Партнери
        </h2>
        <span className="h-px flex-1 bg-white/[.12]" />
      </div>
      <p className="-mt-2 mb-7 max-w-[640px] text-base leading-relaxed text-paper/[.62]">
        Ми працюємо напряму з виробниками — тому ціна, оригінальність
        продукту та технічний супровід гарантовані.
      </p>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-white/[.09] bg-white/[.09] md:grid-cols-4">
        {PARTNERS.map((b) => {
          const inCatalog = CATALOG_BRANDS.has(b.name);
          const body = (
            <>
              <PartnerLogo name={b.name} />
              <div className="h-px w-8 bg-brand/[.28]" />
              <div>
                <p className="font-heading text-[14.5px] font-bold tracking-wide text-[#141414]">
                  {b.name}
                </p>
                <p className="mt-1 text-xs text-[#8a8582]">{b.role}</p>
                {inCatalog && (
                  <p className="mt-2 text-[11.5px] font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100">
                    Дивитись товари →
                  </p>
                )}
              </div>
            </>
          );

          const cardClass =
            "group flex flex-col items-center gap-4 bg-card px-[22px] py-[26px] text-center text-[#5f5b58] transition-colors hover:bg-white";

          // Бренди без товарів у каталозі лишаються просто плиткою — інакше
          // клік вів би у фільтр, який нічого не показує.
          return inCatalog ? (
            <button
              key={b.name}
              type="button"
              onClick={() => router.push(`/?brand=${encodeURIComponent(b.name)}#catalog`)}
              aria-label={`Показати товари бренду ${b.name} в каталозі`}
              className={cardClass}
            >
              {body}
            </button>
          ) : (
            <div key={b.name} className={cardClass}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="flex flex-col items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[.03] px-6 py-7 text-center"
          >
            <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[11px] bg-brand/[.18] text-brand-light">
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icon}
              </svg>
            </span>
            <p className="font-heading text-base font-semibold leading-snug text-paper">
              {f.title}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
