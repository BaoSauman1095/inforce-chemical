import type { ContactFormInput } from "./validation";

/** Escapes characters that are special in Telegram's MarkdownV2 parse mode. */
function escapeMarkdownV2(value: string): string {
  return value.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (ch) => `\\${ch}`);
}

function formatLeadMessage(data: ContactFormInput): string {
  const lines = [
    "🌾 *Нова заявка з сайту IN FORCE CHEMICAL*",
    "",
    `*Ім'я:* ${escapeMarkdownV2(data.name)}`,
    `*Телефон:* ${escapeMarkdownV2(data.phone)}`,
  ];

  if (data.culture) {
    lines.push(`*Культура:* ${escapeMarkdownV2(data.culture)}`);
  }
  if (data.message) {
    lines.push("", `*Повідомлення:*`, escapeMarkdownV2(data.message));
  }

  lines.push("", `_${escapeMarkdownV2(new Date().toLocaleString("uk-UA"))}_`);

  return lines.join("\n");
}

export class TelegramNotifyError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "TelegramNotifyError";
  }
}

/**
 * Sends a formatted lead notification to the configured Telegram chat.
 * Throws TelegramNotifyError on missing config or a failed API call so the
 * caller can log/report without leaking bot credentials to the client.
 */
export async function sendTelegramLead(data: ContactFormInput): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new TelegramNotifyError(
      "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured on the server"
    );
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLeadMessage(data),
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
      // Never cache outbound notification calls.
      cache: "no-store",
    });
  } catch (err) {
    throw new TelegramNotifyError("Network error while calling Telegram API", err);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = JSON.stringify(await response.json());
    } catch {
      // ignore body parse errors, we still have the status
    }
    throw new TelegramNotifyError(
      `Telegram API responded with ${response.status}: ${details}`
    );
  }
}
