import {
  applyChanges,
  detectJump,
  extractBakedRates,
  fetchRatesFromMonobank,
  validateRates,
} from "@/lib/rateRefresh";
import { sendRateRefreshNotification } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const REPO_OWNER = "BaoSauman1095";
const REPO_NAME = "inforce-chemical";
const REPO_BRANCH = "main";
const FILE_PATH = "lib/catalog-data.ts";

/**
 * Щоденний автоматичний перерахунок каталогу за курсом kurs.com.ua —
 * без людини в контурі (свідомий вибір власника: «повна автоматика без
 * підтвердження»). Викликається виключно Vercel Cron (див. `vercel.json`),
 * підтверджує це заголовком Authorization за CRON_SECRET.
 *
 * Курс береться з публічного API Monobank (без ключа) — kurs.com.ua/mezhbank
 * блокує запити з Vercel навіть зі звичайними браузерними заголовками (403
 * незмінно), а безкоштовного агрегованого міжбанківського індексу не існує
 * (це й є платний продукт kurs.com.ua). З перевірених безкоштовних
 * відповідників (Monobank, безготівковий курс ПриватБанку) власник обрав
 * Monobank (див. lib/rateRefresh.ts).
 *
 * Сайт статично рендерить ціни під час збірки — тут немає окремого сховища
 * "поточного курсу", яке читалось би при кожному показі сторінки. Замість
 * цього роут читає lib/catalog-data.ts напряму з GitHub, рахує нові ціни
 * (та сама формула й регулярки, що в scripts/refresh-rate.ts — спільний
 * код у lib/rateRefresh.ts) і одразу комітить оновлений файл у main через
 * GitHub Contents API. Push у main — це і є тригер: Vercel вже підключений
 * до репозиторію й задеплоїть новий прод сам, без додаткових кроків.
 *
 * Жодного проміжного огляду diff перед виходом у прод — так і задумано.
 * Єдина протидія: validateRates ловить сміття з парсера (0, NaN, випадково
 * підхоплена дельта на кшталт "▼-0,052") і скасовує оновлення, а
 * detectJump — не блокує реальний ринковий стрибок (власник хоче саме
 * відображати фактичний курс), лише позначає його в Telegram. Кожен запуск
 * — успішний, без змін чи з помилкою — шле одне повідомлення в Telegram
 * (lib/telegram.ts): без людини в контурі це єдиний канал, яким видно, що
 * крон взагалі спрацював.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    const message = "Відсутня змінна оточення GITHUB_TOKEN";
    console.error(`refresh-rate cron: ${message}`);
    await sendRateRefreshNotification({ ok: false, error: message }).catch(() => {});
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  try {
    const rates = await fetchRatesFromMonobank();
    validateRates(rates);

    const ghHeaders = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const getRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${REPO_BRANCH}`,
      { headers: ghHeaders, cache: "no-store" }
    );
    if (!getRes.ok) {
      throw new Error(`GitHub GET contents: ${getRes.status} ${await getRes.text()}`);
    }
    const file = (await getRes.json()) as { content: string; sha: string };
    const src = Buffer.from(file.content, "base64").toString("utf-8");

    const anomaly = detectJump(rates, extractBakedRates(src));
    const { next, changes } = applyChanges(src, rates);

    if (changes.length === 0) {
      console.log(`refresh-rate cron: курс USD ${rates.USD} / EUR ${rates.EUR}, змін немає`);
      // Каталог уже консистентний із цим курсом — далі нема чого комітити,
      // тож збій самого Telegram тут не повинен перетворити успіх на 500.
      await sendRateRefreshNotification({ ok: true, rates, changed: 0, anomaly }).catch((e) =>
        console.error("refresh-rate cron: не вдалось надіслати сповіщення в Telegram", e)
      );
      return Response.json({ ok: true, rates, changed: 0 });
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            `Автооновлення курсу: USD ${rates.USD}, EUR ${rates.EUR} (${changes.length} поз.)\n\n` +
            `Щоденний крон, без ручного підтвердження — Monobank, курс продажу.`,
          content: Buffer.from(next, "utf-8").toString("base64"),
          sha: file.sha,
          branch: REPO_BRANCH,
        }),
      }
    );
    if (!putRes.ok) {
      throw new Error(`GitHub PUT contents: ${putRes.status} ${await putRes.text()}`);
    }

    console.log(
      `refresh-rate cron: курс USD ${rates.USD} / EUR ${rates.EUR}, оновлено ${changes.length} поз., ` +
        `запушено в ${REPO_BRANCH}${anomaly ? `; ${anomaly}` : ""}`
    );
    // Коміт уже запушено — збій сповіщення не має маскувати успішне оновлення 500-кою.
    await sendRateRefreshNotification({ ok: true, rates, changed: changes.length, anomaly }).catch((e) =>
      console.error("refresh-rate cron: не вдалось надіслати сповіщення в Telegram", e)
    );
    return Response.json({ ok: true, rates, changed: changes.length, anomaly });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`refresh-rate cron: помилка — ${message}`);
    await sendRateRefreshNotification({ ok: false, error: message }).catch(() => {});
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
