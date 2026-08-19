"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto max-w-[1240px] scroll-mt-[90px] px-5 pb-16 pt-16 md:px-7 md:pb-20 md:pt-24"
    >
      <div className="max-w-[900px]">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-heading text-[40px] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-[52px] md:text-[64px] lg:text-[74px]"
        >
          Все для врожаю —
          <br />
          <span className="text-brand-light">від насіння до збирання</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="mt-6 max-w-[620px] text-pretty text-lg leading-relaxed text-paper/[.68]"
        >
          Офіційне дистриб&apos;юторство Limagrain, Ocean Invest, Biolchim та
          Holland Farming. Власна агрономічна служба супроводжує поле від
          сівби до збирання — підбір гібридів, схеми живлення та захисту,
          виїзд агронома.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-9 flex flex-wrap gap-3.5"
        >
          <a
            href="#contacts"
            className="rounded-xl bg-brand px-7 py-4 font-heading text-[15px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover"
          >
            Задати питання
          </a>
          <a
            href="#catalog"
            className="rounded-xl border border-paper/[.28] px-7 py-4 font-heading text-[15px] font-semibold tracking-wide text-paper transition-colors hover:border-paper hover:bg-white/5"
          >
            Дивитись продукцію
          </a>
        </motion.div>
      </div>
    </section>
  );
}
