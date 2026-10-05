import { applyPrice1CChanges, fetchPrices1C } from "@/lib/price1c";
import { sendPrice1CSyncNotification } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const REPO_OWNER = "BaoSauman1095";
const REPO_NAME = "inforce-chemical";
const REPO_BRANCH = "main";
const FILE_PATH = "lib/catalog-data.ts";

/**
 * Синхронізація орієнтовних цін із 1С — той самий патерн, що й
 * app/api/cron/refresh-rate/route.ts (lib/rateRefresh.ts) для курсу валют:
 * без людини в контурі, крон читає lib/catalog-data.ts напряму з GitHub,
 * накладає зміни (lib/price1c.ts) і одразу комітить оновлений файл у main
 * через GitHub Contents API — push у main і є тригер, Vercel задеплоїть
 * новий прод сам.
 *
 * 1С доступна лише з одного білого IP (VPS, окремий проєкт
 * inforce-manager) — сайт на Vercel не може достукатись до неї напряму.
 * Джерело тут — ендпоінт порталу менеджерів (PUBLIC_PRICES_API_URL), що
 * вже віддає готові числа в гривнях, з ПДВ, без мінімальних цін і без
 * умов «Кредит»/«Вексель» — уся бізнес-логіка 1С застосована там, не тут
 * (детальний контракт і причини — у шапці lib/price1c.ts).
 *
 * На відміну від refresh-rate (курс рухається щодня для будь-якої
 * FX-прив'язаної позиції), тут немає окремого «на все» перерахунку:
 * applyPrice1CChanges чіпає лише ті (slug, пачка), що явно прийшли у
 * відповіді порталу — решта каталогу (позиції, яких портал ще не
 * синхронізував) лишається як є.
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
    console.error(`sync-1c-prices cron: ${message}`);
    await sendPrice1CSyncNotification({ ok: false, error: message }).catch(() => {});
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  try {
    const entries = await fetchPrices1C();

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

    const { next, changes, warnings } = applyPrice1CChanges(src, entries);

    if (changes.length === 0) {
      console.log(
        `sync-1c-prices cron: отримано ${entries.length} поз. від порталу, змін немає` +
          (warnings.length ? `; попереджень: ${warnings.length}` : "")
      );
      await sendPrice1CSyncNotification({ ok: true, changed: 0, warnings }).catch((e) =>
        console.error("sync-1c-prices cron: не вдалось надіслати сповіщення в Telegram", e)
      );
      return Response.json({ ok: true, changed: 0, warnings });
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            `Синхронізація орієнтовних цін з 1С (${changes.length} поз.)\n\n` +
            `Автоматичний крон, без ручного підтвердження — джерело: ${process.env.PUBLIC_PRICES_API_URL ?? "PUBLIC_PRICES_API_URL"}.`,
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
      `sync-1c-prices cron: оновлено ${changes.length} поз., запушено в ${REPO_BRANCH}` +
        (warnings.length ? `; попереджень: ${warnings.length}` : "")
    );
    await sendPrice1CSyncNotification({ ok: true, changed: changes.length, warnings }).catch((e) =>
      console.error("sync-1c-prices cron: не вдалось надіслати сповіщення в Telegram", e)
    );
    return Response.json({ ok: true, changed: changes.length, warnings });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`sync-1c-prices cron: помилка — ${message}`);
    await sendPrice1CSyncNotification({ ok: false, error: message }).catch(() => {});
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
