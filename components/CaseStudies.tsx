"use client";

import { motion } from "framer-motion";
import ImagePlaceholder from "./ImagePlaceholder";

const CASES = [
  {
    label: "фото — кукурудза",
    title: "2 метри. 3 качана. Одна рослина",
    text: "Гібриди Limagrain у полях наших клієнтів.",
  },
  {
    label: "фото — соняшник",
    title: "Соняшник вище людини — без хвороб",
    text: "Схема захисту фунгіцидами лінійки БТ.",
  },
  {
    label: "фото — цибуля",
    title: "6 см проти 4,5. Різниця в препараті",
    text: "Порівняння на одному полі, одна дата сівби.",
  },
  {
    label: "фото — картопля",
    title: "Бульба гниє щороку. Що робити?",
    text: "Протруйники насіння та живлення при посадці.",
  },
];

export default function CaseStudies() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-7">
      <div className="mb-8 flex items-baseline gap-4">
        <h2 className="font-heading text-[28px] font-extrabold tracking-tight sm:text-[36px] md:text-[44px]">
          Наші результати в полі
        </h2>
        <span className="h-px flex-1 bg-white/[.12]" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CASES.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="overflow-hidden rounded-2xl bg-card shadow-panelLg"
          >
            <ImagePlaceholder label={c.label} className="h-[168px]" />
            <div className="px-5 pb-[22px] pt-5">
              <p className="font-heading text-[19px] font-bold leading-[1.3] text-balance text-[#141414]">
                {c.title}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#5f5b58]">
                {c.text}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
