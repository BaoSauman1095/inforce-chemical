/**
 * Ручний запуск перерахунку каталогу за курсом валют — сама логіка в
 * lib/rateRefresh.ts (використовується і тут, і в крон-роуті
 * app/api/cron/refresh-rate/route.ts для щоденного автозапуску).
 *
 * Курс береться з публічного API Monobank (без ключа), курс продажу
 * (rateSell) — вищий з пари, найближчий безкоштовний відповідник
 * міжбанківського курсу продажу. Або вручну прапорцями --usd / --eur.
 *
 * Запуск:
 *   npm run refresh-rate                       — показати, що зміниться
 *   npm run refresh-rate -- --write             — застосувати до файлу
 *   npm run refresh-rate -- --usd 44.629 --eur 51.810 --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyChanges, fetchRatesFromMonobank, type Rates } from "../lib/rateRefresh";

const CATALOG_PATH = join(__dirname, "..", "lib", "catalog-data.ts");

function parseArgs(argv: string[]) {
  const args = { write: false, usd: undefined as number | undefined, eur: undefined as number | undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--write") args.write = true;
    else if (argv[i] === "--usd") args.usd = Number(argv[++i]);
    else if (argv[i] === "--eur") args.eur = Number(argv[++i]);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const rates: Rates =
    args.usd !== undefined && args.eur !== undefined
      ? { USD: args.usd, EUR: args.eur }
      : await fetchRatesFromMonobank();

  console.log(`Курс продажу (Monobank): USD ${rates.USD}, EUR ${rates.EUR}\n`);

  const src = readFileSync(CATALOG_PATH, "utf-8");
  const { next, changes } = applyChanges(src, rates);

  if (changes.length === 0) {
    console.log("Змін немає — усі прив'язані до курсу ціни вже відповідають цьому курсу.");
    return;
  }

  console.log(`Позицій зі зміною ціни: ${changes.length}\n`);
  for (const c of changes) {
    const sign = c.newPrice > c.oldPrice ? "▲" : "▼";
    console.log(
      `  ${sign} ${c.name} (${c.pack})  ${c.oldPrice} → ${c.newPrice} грн  ` +
        `[${c.indicativePrice} ${c.currency}]  ${c.slug}`
    );
  }

  if (args.write) {
    writeFileSync(CATALOG_PATH, next, "utf-8");
    console.log(`\nЗаписано в ${CATALOG_PATH}. Перевірте tsc/lint/build і закомітьте як завжди.`);
  } else {
    console.log("\nЦе попередній перегляд — файл не змінено. Додайте --write, щоб застосувати.");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
