import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { productQuestionSchema } from "@/lib/validation";
import { sendProductQuestion, TelegramNotifyError } from "@/lib/telegram";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    if (isRateLimited(`question:${ip}`)) {
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

    const parsed = productQuestionSchema.parse(body);

    // Honeypot triggered — silently report success to avoid tipping off bots.
    if (parsed.company) {
      return NextResponse.json({ ok: true });
    }

    await sendProductQuestion(parsed);

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
      console.error("[product-question] Telegram delivery failed:", err.message, err.cause);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Не вдалося надіслати питання. Зателефонуйте нам напряму або спробуйте пізніше.",
        },
        { status: 502 }
      );
    }

    console.error("[product-question] Unexpected error:", err);
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
