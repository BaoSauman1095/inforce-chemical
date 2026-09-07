import type { ContactFormInput, CartOrderInput, ProductQuestionInput } from "./validation";
import type { ResolvedOrderLine } from "./products";
import { formatPrice, formatPhoneIntl } from "./utils";

/**
 * Дублює заявки з сайту на пошту менеджера поряд із Telegram
 * (lib/telegram.ts) — той самий набір подій (лід, замовлення, питання про
 * товар), інший канал. Через Resend (https://resend.com): просте REST API,
 * без SMTP-портів, які в serverless-середовищі Vercel часто ненадійні.
 *
 * На відміну від Telegram, лист не блокує відповідь клієнту: пошта тут —
 * додатковий канал, Telegram лишається основним і обов'язковим.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const MANAGER_EMAIL = "vladyslav.podterebo@ifchemical.com";
const FROM_ADDRESS = "IN FORCE CHEMICAL <noreply@inforcechemical.com>";

export class EmailNotifyError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "EmailNotifyError";
  }
}

async function sendEmail(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new EmailNotifyError("RESEND_API_KEY is not configured on the server");
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: MANAGER_EMAIL,
        subject,
        html,
      }),
      cache: "no-store",
    });
  } catch (err) {
    throw new EmailNotifyError("Network error while calling Resend API", err);
  }

  if (!response.ok) {
    let details = "";
    try {
      details = JSON.stringify(await response.json());
    } catch {
      // ignore body parse errors, we still have the status
    }
    throw new EmailNotifyError(`Resend API responded with ${response.status}: ${details}`);
  }
}

function formatLeadEmail(data: ContactFormInput): string {
  const rows = [
    `<p><strong>Ім'я:</strong> ${escapeHtml(data.name)}</p>`,
    `<p><strong>Телефон:</strong> ${escapeHtml(formatPhoneIntl(data.phone))}</p>`,
  ];
  if (data.culture) {
    rows.push(`<p><strong>Культура:</strong> ${escapeHtml(data.culture)}</p>`);
  }
  if (data.message) {
    rows.push(`<p><strong>Повідомлення:</strong><br>${escapeHtml(data.message)}</p>`);
  }
  return `<h2>Нова заявка з сайту IN FORCE CHEMICAL</h2>${rows.join("")}`;
}

function formatOrderEmail(data: CartOrderInput, lines: ResolvedOrderLine[]): string {
  const rows = lines.map((line) => {
    const priced = line.total === null ? "ціна за запитом" : `${formatPrice(line.total)} грн`;
    return `<li>${escapeHtml(line.name)} (${escapeHtml(line.brand)}) — ${escapeHtml(line.packLabel)} × ${line.quantity} — ${escapeHtml(priced)}</li>`;
  });

  const total = lines.reduce((sum, l) => sum + (l.total ?? 0), 0);
  const hasUnpriced = lines.some((l) => l.total === null);
  const totalLine =
    total > 0
      ? `<p><strong>Разом:</strong> ${formatPrice(total)} грн${hasUnpriced ? " (без позицій за запитом)" : ""}</p>`
      : `<p>Усі позиції — ціна за запитом</p>`;

  return [
    `<h2>Нове замовлення — IN FORCE CHEMICAL</h2>`,
    `<p><strong>Ім'я:</strong> ${escapeHtml(data.name)}</p>`,
    `<p><strong>Телефон:</strong> ${escapeHtml(formatPhoneIntl(data.phone))}</p>`,
    `<p><strong>Позицій:</strong> ${lines.length}</p>`,
    `<ol>${rows.join("")}</ol>`,
    totalLine,
  ].join("");
}

function formatQuestionEmail(data: ProductQuestionInput): string {
  return [
    `<h2>Питання про товар — IN FORCE CHEMICAL</h2>`,
    `<p><strong>Товар:</strong> ${escapeHtml(data.productName)}</p>`,
    `<p><strong>Ім'я:</strong> ${escapeHtml(data.name)}</p>`,
    `<p><strong>Телефон:</strong> ${escapeHtml(formatPhoneIntl(data.phone))}</p>`,
    `<p><strong>Питання:</strong><br>${escapeHtml(data.question)}</p>`,
  ].join("");
}

export async function sendLeadEmail(data: ContactFormInput): Promise<void> {
  await sendEmail("Нова заявка з сайту", formatLeadEmail(data));
}

export async function sendCartOrderEmail(
  data: CartOrderInput,
  lines: ResolvedOrderLine[]
): Promise<void> {
  await sendEmail("Нове замовлення з сайту", formatOrderEmail(data, lines));
}

export async function sendProductQuestionEmail(data: ProductQuestionInput): Promise<void> {
  await sendEmail("Питання про товар з сайту", formatQuestionEmail(data));
}
