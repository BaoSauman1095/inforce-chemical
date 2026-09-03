import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { cartOrderSchema } from "@/lib/validation";
import { resolveOrderItems } from "@/lib/products";
import { sendCartOrder, TelegramNotifyError } from "@/lib/telegram";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    if (isRateLimited(`order:${ip}`)) {
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

    const parsed = cartOrderSchema.parse(body);

    // Ханіпот спрацював — вдаємо успіх, щоб не підказувати ботам про перевірку.
    if (parsed.company) {
      return NextResponse.json({ ok: true });
    }

    // Назви й ціни беремо з каталогу, а не з запиту.
    const lines = resolveOrderItems(parsed.items);
    if (lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Товарів із замовлення більше немає в каталозі. Оновіть сторінку.",
        },
        { status: 422 }
      );
    }

    await sendCartOrder(parsed, lines);

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
      console.error("[cart-order] Telegram delivery failed:", err.message, err.cause);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Не вдалося надіслати замовлення. Зателефонуйте нам напряму або спробуйте пізніше.",
        },
        { status: 502 }
      );
    }

    console.error("[cart-order] Unexpected error:", err);
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
