# PROJECT STATUS — IN FORCE CHEMICAL (2026)

Снімок стану проєкту для передачі/довідки станом на **20.08.2026**.
Усі факти в цьому документі перевірені безпосередньо (git-історія, вміст
файлів, реальний деплой), а не переписані з чернетки без перевірки.

> ⚠️ **Про креденшели.** У розділі 4 нижче навмисно немає реального
> `TELEGRAM_BOT_TOKEN` і `TELEGRAM_CHAT_ID` — цей файл піде в публічний
> git-репозиторій, а токен бота в git-історії means будь-хто зможе слати
> повідомлення від імені бота. Реальні значення — лише в `.env.local`
> (не в git, у `.gitignore`) та в Environment Variables проєкту на Vercel.

## 1. Що було зроблено

- Побудовано сайт-каталог на Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Реалізовано SEO (метадані, JSON-LD, sitemap.xml, robots.txt, OG-картинка на льоту)
- Інтегровано надсилання заявок у Telegram-групу (3 окремі форми, див. розділ 3)
- Каталог продукції наповнено реальними даними (66 товарів, див. розділ 2)
- Реалізовано динамічні сторінки товару (`/products/[slug]`) з повною інформацією:
  опис, діюча речовина/формула, культури, таблиця норм витрат, галерея, схожі товари
- Додано перемикач фасування з динамічною ціною (на картці каталогу і на сторінці товару)
- Форми "Замовити товар" і "Задати питання про товар" з відправкою в Telegram,
  захистом від ботів (honeypot) і rate-limit
- Проєкт задеплоєно на Vercel, автодеплой при пуші в `main` — **перевірено, сайт
  реально відкривається**: https://inforce-chemical.vercel.app

## 2. Поточний стан каталогу

- **Усього товарів: 66**
- **Ocean Invest: 33** — актуалізовано під редакцію каталогу 2026 року
- **Biolchim: 9** — реальна лінійка добрив (замість демо-даних)
- **Holland Farming: 1** (Кропмакс) — реальний товар замість 3 демо-позицій
- Інші бренди (Limagrain, Farmsaat, Apsov, Himagro M, Sumi Agro) — залишені як
  демо-дані, ще не замінені на реальний асортимент
- Категорії: **Насіння** (Соняшник, Кукурудза, Ріпак), **Добрива**
  (Водорозчинні добрива, Стартові та мікроелементи, Біостимулятори),
  **Захист рослин** (Гербіциди, Фунгіциди, Інсектициди, Протруйники,
  Десиканти, Регулятори росту, Ад'юванти)

### Що конкретно змінилось при переході Ocean Invest на редакцію 2026

Порівняно з попередньою (старою) версією друкованого каталогу:

1. **Додано 2 нові товари**, яких не було у старій редакції: **Міскорн БТ**
   (мезотріон, гербіцид для кукурудзи) та **Проплей БТ** (пропізохлор,
   ґрунтовий гербіцид) — тепер гербіцидів 14 замість 12
2. **Прибрано "Грум БТ"** (регулятор росту, хлормекват-хлорид) — у редакції
   2026 його немає у асортименті (каталог прямо вказує "33 найменування",
   без розділу "Регулятори росту" для Ocean Invest)
3. **Виправлено норми витрат і культури приблизно у 19 товарах** — цифри в
   новій редакції відрізняються від старої. Приклади:
   - Галоп БТ: норма для "поля під с/г культури" 2,0–6,0 → 2,0–8,0 л/га
   - Клом БТ: додано альтернативний варіант норми для сої (0,25–0,5 л/га)
     і культуру "Картопля"
   - Нейтрин БТ: майже всі норми змінились + додано "падалиця колосових"
   - ДиХлор БТ: норма для соняшника 0,8–1,5 → 0,5–1,0 л/га
   - Клессо БТ: було "плодові насадження й виноградники" (норма 0,4–0,6),
     стало — тільки соя (0,3–0,5 л/га, з опцією 0,7–1,0 у пік заселення)
4. **Виправлено препаративну форму** — Апрув БТ: "Мікроемульсійний
   концентрат" → **"Масляна дисперсія (МД)"**; Стікер БТ і Фомовер БТ:
   "Концентрат суспензії" → **"Розчинний концентрат (РК)"**

### Про добрива (Biolchim / Holland Farming)

- **Biolchim** (9 товарів): лінійка Гідроферт (5 формул NPK — 13.40.13,
  3.11.38, 18.18.18, 20.20.20, 15.5.30), Мікрофол Комбі, Мультибор 21,
  Магністарт NP Zn, Філлотон
- **Holland Farming**: Кропмакс (ультраконцентрований біостимулятор,
  1/5/20 л) замінив 3 демо-товари ("Старт-комплекс NPK", "Амінофол",
  "Гумат калію")
- Фасування й одиниці виміру (л/кг) звірені з колонками "Тара" /
  "Одиниця виміру" прайс-листа постачальника (Google Sheets) — це
  пріоритетне джерело, PDF-каталог постачальника іноді дає ширший список
  фасувань, ніж реально закладено в ціноутворення
- Знайдено, але **не додано** в каталог: "Сіфо CET 46 Грін" (Biolchim,
  1 л) — товар є в прайс-листі, рішення не додавати наразі

## 3. Структура проєкту

```
app/
  layout.tsx                    SEO-метадані, шрифти, JSON-LD Organization
  page.tsx                      головна сторінка (Hero, каталог, кейси, контакти)
  sitemap.ts / robots.ts        /sitemap.xml, /robots.txt
  opengraph-image.tsx / icon.tsx  OG-картинка та favicon (next/og, edge)
  products/
    layout.tsx                  спільний шелл (Header/Footer) для /products/*
    page.tsx                    /products — каталог продукції
    [slug]/page.tsx              /products/[slug] — картка товару, generateMetadata
  api/
    send-notification/route.ts  форма контактів (головна сторінка) → Telegram
    product-order/route.ts      форма "Замовити товар" → Telegram
    product-question/route.ts   форма "Задати питання" → Telegram

components/
  Header.tsx, Footer.tsx        логотип, навігація (з "Головна"), телефон
  Hero.tsx, CaseStudies.tsx, Partners.tsx, ContactSection.tsx, MobileCTA.tsx
  Catalog.tsx                   каталог: вкладки/пошук/фільтри/пагінація (next/dynamic)
  ProductCard.tsx                картка товару в каталозі, перемикач фасування
  ProductDetail.tsx               сторінка товару, перемикач фасування
  ProductGallery.tsx               галерея (1 фото + зум)
  ProductActions.tsx                кнопки "Замовити"/"Задати питання" + модалки
  ProductOrderForm.tsx / ProductQuestionForm.tsx   самі форми
  Breadcrumbs.tsx, RelatedProducts.tsx, Modal.tsx  допоміжні UI-блоки
  SmoothScroll.tsx                  плавний rAF-скрол по якорях
  WatermarkBackground.tsx            фонові діагональні написи

lib/
  catalog-data.ts                каталог (66 товарів) — основний файл даних
  products.ts                      flatten каталогу, getProductBySlug, related
  telegram.ts                       форматування й надсилання в Telegram
  validation.ts                      Zod-схеми (contact/order/question форм)
  rate-limit.ts                      спільний in-memory rate-limiter
  constants.ts                        телефон, соцмережі, навігація
  types.ts                             CatalogItem, PackOption, DosageRow тощо

public/
  brand/                        логотип (прозорий PNG, світла версія для темного тла)
```

## 4. Змінні середовища

Реальні значення — **тільки** в `.env.local` (локально, у `.gitignore`) і в
Vercel → Project Settings → Environment Variables (для продакшену). Схема:

```
TELEGRAM_BOT_TOKEN=<токен бота, див. .env.local або Vercel>
TELEGRAM_CHAT_ID=<id групи, див. .env.local або Vercel>
NEXT_PUBLIC_SITE_URL=https://inforce-chemical.vercel.app
NEXT_PUBLIC_PHONE=0-800-33-10-80
NEXT_PUBLIC_PHONE_TEL=0800331080
```

⚠️ Помічено: локальний `.env.local` наразі має
`NEXT_PUBLIC_SITE_URL=https://inforcechemical.ua` (стара заглушка з
`.env.local.example`), а не реальний Vercel-домен. Це не впливає на
продакшн, якщо на Vercel ця змінна виставлена окремо в дашборді — варто
перевірити, що там стоїть саме `https://inforce-chemical.vercel.app`
(або реальний домен, якщо його підключите), бо ця змінна впливає на
canonical/OG/sitemap URL-и.

## 5. GitHub репозиторій

https://github.com/BaoSauman1095/inforce-chemical

## 6. Vercel deployment

https://inforce-chemical.vercel.app — **перевірено, сайт відкривається**,
автодеплой при пуші в `main`.

## 7. Що варто зробити далі

- Замінити демо-товари інших брендів (Limagrain, Farmsaat, Apsov, Himagro M,
  Sumi Agro) на реальний асортимент — за тією ж схемою, що й Ocean
  Invest/Biolchim/Holland Farming (PDF-каталог постачальника + прайс-лист)
- Підключити реальні фото товарів замість плейсхолдерів
  (`components/ImagePlaceholder.tsx`)
- Розглянути додавання BASF та інших постачальників з прайс-листа
- Платежі (Stripe/PayPal) — наразі сайт лише приймає заявки в Telegram,
  оплата не автоматизована
- Адмін-панель для керування каталогом (зараз редагування — це прямі
  правки `lib/catalog-data.ts`)
- Підключення реального домену (замість `*.vercel.app`)
- Email-розсилка
- Особистий кабінет / історія замовлень користувача

## 8. Останній комміт (перевірено `git log`)

```
f08bde3 Fix Мультибор 21 / Мікрофол Комбі pack sizes to match price sheet
9a68ab9 Update fertilizer catalog and make brand logo transparent
79546d1 Add brand logo, per-pack pricing switcher, and header/nav polish
72d1ebb Add product detail pages with Telegram-backed order/question forms
1bc8f7e Initial commit: IN FORCE CHEMICAL Next.js project
```

## 9. Важливі файли для перевірки

- `lib/catalog-data.ts` — усі товари (джерело даних каталогу)
- `.env.local` — змінні середовища (не в git)
- `package.json` — залежності (Next.js 14.2.35, React 18.3.1, Framer Motion,
  Zod)
- `next.config.mjs` — конфіг Next.js (security-заголовки, images formats)

## 10. Контакти й облікові дані

- GitHub: [BaoSauman1095](https://github.com/BaoSauman1095)
- Telegram-бот: **@ifchemical_bot** (перевірено через Telegram API `getMe`)
- Telegram-група для заявок: "Заявки In Force Chemical"
- Email: не вказано
