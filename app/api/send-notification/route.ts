import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { contactFormSchema } from "@/lib/validation";
import { sendTelegramLead, TelegramNotifyError } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Very small in-memory rate limiter: good enough to stop accidental
// double-submits and basic bot spam on a single-instance deployment.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Забагато запитів. Спробуйте за хвилину." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Некоректний формат запиту." },
        { status: 400 }
      );
    }

    const parsed = contactFormSchema.parse(body);

    // Honeypot triggered — silently report success to avoid tipping off bots.
    if (parsed.company) {
      return NextResponse.json({ ok: true });
    }

    await sendTelegramLead(parsed);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0];
      return NextResponse.json(
        {
          ok: false,
          error: firstIssue?.message ?? "Перевірте правильність введених даних.",
          fieldErrors: err.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    if (err instanceof TelegramNotifyError) {
      console.error("[send-notification] Telegram delivery failed:", err.message, err.cause);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Не вдалося надіслати заявку. Зателефонуйте нам напряму або спробуйте пізніше.",
        },
        { status: 502 }
      );
    }

    console.error("[send-notification] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Внутрішня помилка сервера." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405 }
  );
}
