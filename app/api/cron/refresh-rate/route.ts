import { applyChanges, fetchRatesFromKurs } from "@/lib/rateRefresh";

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
 * Сайт статично рендерить ціни під час збірки — тут немає окремого сховища
 * "поточного курсу", яке читалось би при кожному показі сторінки. Замість
 * цього роут читає lib/catalog-data.ts напряму з GitHub, рахує нові ціни
 * (та сама формула й регулярки, що в scripts/refresh-rate.ts — спільний
 * код у lib/rateRefresh.ts) і одразу комітить оновлений файл у main через
 * GitHub Contents API. Push у main — це і є тригер: Vercel вже підключений
 * до репозиторію й задеплоїть новий прод сам, без додаткових кроків.
 *
 * Це означає: жодного проміжного огляду diff перед виходом у прод. Якщо
 * колись знадобиться повернути ручне підтвердження — досить прибрати блок
 * PUT нижче й замість нього відкривати pull request (GitHub API це теж
 * уміє), не чіпаючи решту логіки.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const kursKey = process.env.KURS_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  if (!kursKey || !githubToken) {
    const missing = [!kursKey && "KURS_API_KEY", !githubToken && "GITHUB_TOKEN"].filter(Boolean).join(", ");
    console.error(`refresh-rate cron: відсутні змінні оточення: ${missing}`);
    return Response.json({ ok: false, error: `Відсутні змінні оточення: ${missing}` }, { status: 500 });
  }

  try {
    const rates = await fetchRatesFromKurs(kursKey);

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

    const { next, changes } = applyChanges(src, rates);

    if (changes.length === 0) {
      console.log(`refresh-rate cron: курс USD ${rates.USD} / EUR ${rates.EUR}, змін немає`);
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
            `Щоденний крон, без ручного підтвердження — kurs.com.ua, курс продажу (ask) міжбанку.`,
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
        `запушено в ${REPO_BRANCH}`
    );
    return Response.json({ ok: true, rates, changed: changes.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`refresh-rate cron: помилка — ${message}`);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
