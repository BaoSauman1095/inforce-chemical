import type { Catalog } from "./types";

/**
 * Демонстраційний каталог. Замініть на дані з вашої облікової системи
 * (1С, Poster, Google Sheets тощо) — структура групи/товару лишається тією ж.
 */
export const CATALOG: Catalog = {
  seeds: [
    {
      title: "Соняшник",
      icon: "🌻",
      items: [
        { name: "ЛГ 50639 КЛП", brand: "Limagrain", packs: ["п.о. 150 000"], price: 4850, unit: "п.о." },
        { name: "ЛГ 5580 КЛП", brand: "Limagrain", packs: ["п.о. 150 000"], price: 4650, unit: "п.о." },
        { name: "ЕС Романтик", brand: "Limagrain", packs: ["п.о. 150 000"], price: 4200, unit: "п.о." },
        { name: "САНАй КЛ", brand: "Farmsaat", packs: ["п.о. 150 000"], price: 3950, unit: "п.о." },
      ],
    },
    {
      title: "Кукурудза",
      icon: "🌽",
      items: [
        { name: "ЛГ 31.233", brand: "Limagrain", packs: ["п.о. 50 000", "п.о. 80 000"], price: 3600, unit: "п.о." },
        { name: "ЛГ 30.315", brand: "Limagrain", packs: ["п.о. 50 000"], price: 3450, unit: "п.о." },
        { name: "СІ Фотон", brand: "Farmsaat", packs: ["п.о. 50 000"], price: 3300, unit: "п.о." },
        { name: "ЛГ 31.530", brand: "Limagrain", packs: ["п.о. 50 000"], price: 3750, unit: "п.о." },
      ],
    },
    {
      title: "Ріпак",
      icon: "🌱",
      items: [
        { name: "ЛГ Аліго", brand: "Limagrain", packs: ["1,5 млн нас."], price: 5200, unit: "од." },
        { name: "ЛГ Ексель", brand: "Limagrain", packs: ["1,5 млн нас."] },
        { name: "Санлайт", brand: "Apsov", packs: ["1,5 млн нас."], price: 4800, unit: "од." },
      ],
    },
  ],
  fert: [
    {
      title: "Водорозчинні добрива",
      icon: "💧",
      items: [
        { name: "NPK 20-20-20 + мікро", brand: "Biolchim", packs: ["1 кг", "5 кг", "25 кг"], price: 185, unit: "кг" },
        { name: "Монокалійфосфат 0-52-34", brand: "Biolchim", packs: ["1 кг", "25 кг"], price: 210, unit: "кг" },
        { name: "Кальцієва селітра", brand: "Biolchim", packs: ["25 кг"], price: 95, unit: "кг" },
        { name: "Сульфат калію 0-0-50", brand: "Biolchim", packs: ["25 кг"] },
      ],
    },
    {
      title: "Стартові та мікроелементи",
      icon: "⚗️",
      items: [
        { name: "Бороплюс", brand: "Biolchim", packs: ["1 л", "5 л"], price: 320, unit: "л" },
        { name: "Хелат цинку Zn 15%", brand: "Biolchim", packs: ["1 кг"], price: 275, unit: "кг" },
        { name: "Старт-комплекс NPK 10-34-0", brand: "Holland Farming", packs: ["1 л", "10 л"], price: 240, unit: "л" },
      ],
    },
    {
      title: "Біостимулятори",
      icon: "🌿",
      items: [
        { name: "Амінофол", brand: "Holland Farming", packs: ["1 л", "5 л"], price: 410, unit: "л" },
        { name: "Гумат калію", brand: "Holland Farming", packs: ["1 л", "10 л"], price: 165, unit: "л" },
        { name: "Екстракт морських водоростей", brand: "Biolchim", packs: ["1 л"] },
      ],
    },
  ],
  prot: [
    {
      title: "Гербіциди",
      icon: "🌾",
      items: [
        { name: "Тайфун 480 SL", brand: "Ocean Invest", packs: ["1 л", "5 л", "20 л"], price: 385, unit: "л" },
        { name: "Ацетохлор 900 EC", brand: "Ocean Invest", packs: ["5 л", "10 л"], price: 420, unit: "л" },
        { name: "Флурохлоридон 250 SC", brand: "Himagro M", packs: ["5 л"] },
        { name: "Тифенсульфурон 75 WG", brand: "Sumi Agro", packs: ["1 кг"], price: 1650, unit: "кг" },
      ],
    },
    {
      title: "Фунгіциди",
      icon: "🛡️",
      items: [
        { name: "Азоксистробін БТ", brand: "Ocean Invest", packs: ["1 л", "5 л"], price: 890, unit: "л" },
        { name: "Пропіконазол 250 EC", brand: "Himagro M", packs: ["5 л"], price: 720, unit: "л" },
        { name: "Тебуконазол 250 EW", brand: "Sumi Agro", packs: ["1 л", "10 л"] },
      ],
    },
    {
      title: "Інсектициди",
      icon: "🐛",
      items: [
        { name: "Лямбда-цигалотрин 50 EC", brand: "Ocean Invest", packs: ["1 л", "5 л"], price: 540, unit: "л" },
        { name: "Ацетаміприд 200 SL", brand: "Sumi Agro", packs: ["1 л"], price: 610, unit: "л" },
        { name: "Хлорпірифос 480 EC", brand: "Himagro M", packs: ["5 л", "20 л"] },
      ],
    },
    {
      title: "Протруйники",
      icon: "💊",
      items: [
        { name: "Тіраму 400 + Карбоксин", brand: "Ocean Invest", packs: ["5 л", "20 л"], price: 950, unit: "л" },
        { name: "Флудиоксоніл + Металаксил", brand: "Sumi Agro", packs: ["5 л"] },
        { name: "Імідаклоприд 600 FS", brand: "Himagro M", packs: ["5 л", "20 л"], price: 1120, unit: "л" },
      ],
    },
    {
      title: "Десиканти",
      icon: "🍂",
      items: [
        { name: "Дикват 150 SL", brand: "Ocean Invest", packs: ["5 л", "20 л"], price: 460, unit: "л" },
        { name: "Гліфосат 480 SL", brand: "Himagro M", packs: ["5 л", "10 л", "20 л"], price: 210, unit: "л" },
      ],
    },
    {
      title: "Регулятори росту",
      icon: "📈",
      items: [
        { name: "Хлормекват-хлорид 750 SL", brand: "Sumi Agro", packs: ["5 л"], price: 380, unit: "л" },
        { name: "Тебуконазол-регулятор 250 EW", brand: "Himagro M", packs: ["5 л"] },
      ],
    },
    {
      title: "Ад'юванти",
      icon: "🧪",
      items: [
        { name: "Прилипач-змочувач НПАР", brand: "Ocean Invest", packs: ["1 л", "5 л", "20 л"], price: 145, unit: "л" },
        { name: "Мінеральна олія 850 EC", brand: "Sumi Agro", packs: ["5 л", "20 л"], price: 165, unit: "л" },
      ],
    },
  ],
};

export const CATALOG_TABS: { key: keyof Catalog; label: string }[] = [
  { key: "seeds", label: "Насіння" },
  { key: "fert", label: "Добрива" },
  { key: "prot", label: "Захист рослин" },
];
