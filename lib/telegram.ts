import type { ContactFormInput, CartOrderInput, ProductQuestionInput } from "./validation";
import type { ResolvedOrderLine } from "./products";
import { formatPrice, formatPhoneIntl } from "./utils";

/** Escapes characters that are special in Telegram's MarkdownV2 parse mode. */
function escapeMarkdownV2(value: string): string {
  return value.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (ch) => `\\${ch}`);
}

function timestampLine(): string {
  return `_${escapeMarkdownV2(new Date().toLocaleString("uk-UA"))}_`;
}

function formatLeadMessage(data: ContactFormInput): string {
  const lines = [
    "🌾 *Нова заявка з сайту IN FORCE CHEMICAL*",
    "",
    `*Ім'я:* ${escapeMarkdownV2(data.name)}`,
    `*Телефон:* ${escapeMarkdownV2(formatPhoneIntl(data.phone))}`,
  ];

  if (data.culture) {
    lines.push(`*Культура:* ${escapeMarkdownV2(data.culture)}`);
  }
  if (data.message) {
    lines.push("", `*Повідомлення:*`, escapeMarkdownV2(data.message));
  }

  lines.push("", timestampLine());

  return lines.join("\n");
}

function formatOrderMessage(
  data: CartOrderInput,
  lines: ResolvedOrderLine[]
): string {
  const message = [
    "🛒 *Нове замовлення — IN FORCE CHEMICAL*",
    "",
    `*Ім'я:* ${escapeMarkdownV2(data.name)}`,
    `*Телефон:* ${escapeMarkdownV2(formatPhoneIntl(data.phone))}`,
    "",
    `*Позицій:* ${lines.length}`,
    "",
  ];

  lines.forEach((line, i) => {
    const priced =
      line.total === null
        ? "ціна за запитом"
        : `${formatPrice(line.total)} грн`;
    message.push(
      `${i + 1}\\. *${escapeMarkdownV2(line.name)}* \\(${escapeMarkdownV2(line.brand)}\\)`,
      `   ${escapeMarkdownV2(line.packLabel)} × ${line.quantity} — ${escapeMarkdownV2(priced)}`
    );
  });

  const total = lines.reduce((sum, l) => sum + (l.total ?? 0), 0);
  const hasUnpriced = lines.some((l) => l.total === null);

  message.push("");
  if (total > 0) {
    message.push(
      `*Разом:* ${escapeMarkdownV2(`${formatPrice(total)} грн`)}` +
        (hasUnpriced ? escapeMarkdownV2(" (без позицій за запитом)") : "")
    );
  } else {
    message.push(escapeMarkdownV2("Усі позиції — ціна за запитом"));
  }

  message.push("", timestampLine());

  return message.join("\n");
}

function formatQuestionMessage(data: ProductQuestionInput): string {
  const lines = [
    "❓ *Питання про товар — IN FORCE CHEMICAL*",
    "",
    `*Товар:* ${escapeMarkdownV2(data.productName)}`,
    "",
    `*Ім'я:* ${escapeMarkdownV2(data.name)}`,
    `*Телефон:* ${escapeMarkdownV2(formatPhoneIntl(data.phone))}`,
    "",
    `*Питання:*`,
    escapeMarkdownV2(data.question),
    "",
    timestampLine(),
  ];

  return lines.join("\n");
}

export class TelegramNotifyError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "TelegramNotifyError";
  }
}

/**
 * Sends a pre-formatted MarkdownV2 message to the configured Telegram chat.
 * Throws TelegramNotifyError on missing config or a failed API call so
 * callers can log/report without leaking bot credentials to the client.
 */
async function sendTelegramMessage(text: string): Promise<void> {
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
        text,
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

export async function sendTelegramLead(data: ContactFormInput): Promise<void> {
  await sendTelegramMessage(formatLeadMessage(data));
}

export async function sendCartOrder(
  data: CartOrderInput,
  lines: ResolvedOrderLine[]
): Promise<void> {
  await sendTelegramMessage(formatOrderMessage(data, lines));
}

export async function sendProductQuestion(data: ProductQuestionInput): Promise<void> {
  await sendTelegramMessage(formatQuestionMessage(data));
}
