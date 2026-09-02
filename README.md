# IN FORCE CHEMICAL — сайт дистриб'ютора

Готовий до розробки проєкт на Next.js 14 (App Router) + TypeScript + Tailwind CSS.
Лендинг агродистриб'ютора: каталог з фільтрами, кейси, партнери, форма заявки
з надсиланням у Telegram.

> Поточний стан проєкту (що готово, що є демо-заглушкою) — у
> [PROJECT_STATUS.md](./PROJECT_STATUS.md). Історія змін і виправлених
> багів — у [CHANGELOG.md](./CHANGELOG.md).

## Стек

- **Next.js 14** (App Router, Route Handlers, `next/dynamic`, `next/font`, `next/og`)
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **Framer Motion** — анімації появи/скролу, мобільне меню, дропдауни
- **Zod** — валідація форми на сервері
- **Telegram Bot API** — надсилання заявок

## Структура проєкту

```
app/
  layout.tsx            # шрифти, SEO-метадані, JSON-LD (Organization)
  page.tsx               # збірка секцій сторінки
  globals.css
  sitemap.ts              # /sitemap.xml
  robots.ts                # /robots.txt
  opengraph-image.tsx    # OG-картинка 1200×630 (генерується на льоту)
  icon.tsx                 # favicon (генерується на льоту)
  api/
    send-notification/
      route.ts             # POST-хендлер заявки → Telegram

components/
  Header.tsx               # sticky-шапка, десктоп/мобільна навігація
  Hero.tsx                  # головний екран
  Catalog.tsx                 # вкладки, пошук, фільтри, пагінація (next/dynamic)
  ProductCard.tsx               # картка товару
  ImagePlaceholder.tsx            # заглушка фото (діагональні смуги)
  CaseStudies.tsx                   # блок "Наші результати в полі"
  Partners.tsx                        # блок партнерів/брендів
  ContactSection.tsx / ContactForm.tsx  # секція контактів і форма заявки
  Footer.tsx                              # підвал
  MobileCTA.tsx                             # плаваюча кнопка дзвінка (< md)
  WatermarkBackground.tsx                     # фонові діагональні написи
  SmoothScroll.tsx                              # плавний rAF-скрол по якорях

lib/
  catalog-data.ts          # ДЕМО-каталог товарів (замініть на свої дані)
  telegram.ts               # надсилання повідомлення в Telegram
  validation.ts              # Zod-схема форми
  constants.ts                 # телефон, соцмережі, навігація, культури
  types.ts                       # спільні типи каталогу/форми
  utils.ts                         # cn(), formatPrice() тощо
  useOnClickOutside.ts               # хук для закриття дропдауна

public/                    # статичні файли (за потреби)
```

## Швидкий старт

```bash
npm install
cp .env.local.example .env.local
# впишіть у .env.local реальні TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID
npm run dev
```

Відкрийте http://localhost:3000. Якщо порт зайнятий (лишився процес від
попереднього запуску) — Next.js сам підбере наступний вільний (3001, 3002…),
дивіться яку адресу він виведе в терміналі.

Інші команди:

```bash
npm run build      # продакшн-збірка
npm run start       # запуск продакшн-збірки локально
npm run lint          # ESLint
npm run typecheck   # tsc --noEmit
```

## Налаштування Telegram-сповіщень

1. У Telegram напишіть **@BotFather** → `/newbot`, дайте боту ім'я — отримаєте
   `TELEGRAM_BOT_TOKEN`.
2. Дізнайтесь `TELEGRAM_CHAT_ID`:
   - для особистого чату — напишіть боту й відкрийте
     `https://api.telegram.org/bot<TOKEN>/getUpdates`, знайдіть `chat.id`;
     або скористайтесь **@userinfobot**;
   - для групи/каналу — додайте бота туди і зробіть те саме через `getUpdates`.
3. Впишіть обидва значення в `.env.local`.
4. На проді (Vercel/будь-який хостинг) додайте ці ж змінні в налаштування
   середовища — `.env.local` у git не потрапляє (див. `.gitignore`).

Заявки з форми (`components/ContactForm.tsx`) летять на
`POST /api/send-notification`, там проходять Zod-валідацію (`lib/validation.ts`),
після чого `lib/telegram.ts` форматує повідомлення (MarkdownV2, з екрануванням)
і шле його через Bot API. Помилки логуються на сервері (`console.error`) і
не показують користувачу деталі — лише дружнє повідомлення. Є прихований
honeypot-інпут (`company`) — прості боти, що заповнюють приховані поля,
отримують тихий "успіх" без реального надсилання. Ще є мінімальний
in-memory rate-limit (5 запитів/хв з IP) — достатньо для одного інстансу,
для serverless з кількома інстансами розгляньте Upstash/Redis.

## Заміна демо-каталогу на реальні дані

Каталог лежить у `lib/catalog-data.ts` — масив груп із товарами по трьох
вкладках (`seeds`, `fert`, `prot`). Найпростіший шлях розвитку:

- вручну відредагувати цей файл;
- або підключити зовнішнє джерело (Google Sheets API, 1С-вивантаження,
  headless CMS) і генерувати `CATALOG` у build-time чи через
  `fetch` у серверному компоненті — структура типів у `lib/types.ts`
  лишається незмінною.

## Заміна зображень-заглушок

Фото товарів без реального знімка — плейсхолдери
(`components/ImagePlaceholder.tsx`, діагональні смуги з підписом).
Щоб підключити фото товару: покладіть файл у `public/products/{slug}.webp`
і додайте slug у `PRODUCT_PHOTO_SLUGS` (`lib/product-images.ts`).

**Логотипи партнерів** — `public/partners/`, зіставлення «назва партнера →
файл» у `lib/partner-logos.ts`. `components/Partners.tsx` рендерить логотип
через `next/image`, а якщо файлу немає (або він не завантажився) — показує
назву партнера текстом, як було раніше. Наявні файли:

| Партнер       | Файл                            |
| ------------- | ------------------------------- |
| Limagrain     | `public/partners/limagrain.png` |
| Ocean Invest  | `public/partners/ocean-invest.png` |
| Biolchim      | `public/partners/biolchim.png`  |
| Apsov         | `public/partners/apsov.png`     |
| Farmsaat      | `public/partners/farmsaat.png`  |
| Himagro M     | `public/partners/himagro.png`   |

Holland Farming і Sumi Agro поки без логотипів — їхні картки лишаються
текстовими. Щоб додати: покладіть файл у `public/partners/` і впишіть його
в `PARTNER_LOGOS`.

Картки партнерів мають майже білий фон (`#fdfcfc`, білий на hover), тому
у наявних логотипів білий фон вирізано в прозорість (заливкою від країв,
щоб білі ділянки всередині літер збереглися). Висота слота — 64 px,
логотип вписується через `object-contain`.

## SEO

- Метадані, Open Graph, Twitter Card, `robots`, canonical — `app/layout.tsx`.
- `app/opengraph-image.tsx` і `app/icon.tsx` генерують PNG на льоту через
  `next/og` (не потрібні окремі файли-картинки).
- JSON-LD `Organization` вбудовано в `<head>`.
- `/sitemap.xml` і `/robots.txt` — з `app/sitemap.ts` / `app/robots.ts`.
- Встановіть `NEXT_PUBLIC_SITE_URL` у `.env` на реальний домен перед
  деплоєм — від нього залежать canonical/OG/sitemap URL-и.

## Плавна навігація по якорях

Клік по посиланню `<a href="#section">` (шапка, кнопки "Детальніше",
"Показати ще" тощо) анімується власним кодом у `components/SmoothScroll.tsx`
через `requestAnimationFrame`, а не нативним `scrollIntoView({behavior:
'smooth'})` чи глобальним CSS `scroll-behavior: smooth`. Причина: на довгій
сторінці нативна анімація браузера може "заклинити", якщо користувач починає
крутити колесо/тачпад до того, як вона завершилась. Власна реалізація
скасовується миттєво при будь-якому реальному `wheel`/`touchstart`/`keydown`
— керування завжди повертається користувачу без затримки. Звичайний скрол
(колесо, тачпад, клавіші, смуга прокрутки) ніколи не перехоплюється —
анімується лише сам клік по якірному посиланню.

## Продуктивність

- `components/Catalog.tsx` завантажується через `next/dynamic` окремим
  чанком (зі скелетон-плейсхолдером), щоб не роздувати початковий бандл.
- Шрифти (Inter, Montserrat) через `next/font/google` — self-hosted,
  без runtime-запитів до Google Fonts, `display: swap`.
- Зображення оптимізуються `next/image` (коли підключите реальні фото).
- `next.config.mjs` вмикає gzip/brotli-compress і базові security-заголовки.

## Відомі обмеження

- `app/icon.tsx` і `app/opengraph-image.tsx` працюють на `edge` runtime —
  це вимкне статичну генерацію саме для цих двох роутів (очікувано,
  Next.js попереджає про це при білді; на сторінку це не впливає).
- `npm audit` показує high-severity попередження на **внутрішній** (вкладений
  у `node_modules/next`) postcss — це залежність самого Next.js 14, а не
  прямий ризик для цього проєкту. Критичну вразливість самого Next.js вже
  закрито (використовується остання патч-версія лінійки 14 — `14.2.35`).
  Перехід на Next.js 15/16 — окрема задача (App Router API місцями змінився).
- Rate-limit у `/api/send-notification` — in-memory, скидається при
  рестарті/на serverless з кількома інстансами не є суворим лімітом.

## Деплой

Найпростіше — Vercel (нативна підтримка Next.js): підключіть репозиторій,
додайте env-змінні з `.env.local.example` у Project Settings → Environment
Variables, задеплойте. Для інших хостингів — `npm run build && npm run start`
за Node.js 18+.
