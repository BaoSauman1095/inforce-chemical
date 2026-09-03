"use client";

import { useState, type FormEvent } from "react";

export type LeadFormStatus = "idle" | "loading" | "success" | "error";

interface UseLeadFormOptions<T extends Record<string, string>> {
  /** API-роут, куди йде POST. */
  endpoint: string;
  initialValues: T;
  /** Тіло запиту; за замовчуванням — самі поля форми. */
  buildPayload?: (values: T) => unknown;
  /** Текст помилки, якщо сервер не повернув свій. */
  fallbackError: string;
  /** Що зробити після успішної відправки (очистити кошик тощо). */
  onSuccess?: () => void;
}

/**
 * Стан і відправка форми-заявки: значення полів, статус, помилка.
 * Усі форми сайту ходять на свої роути однаково — POST з JSON і відповідь
 * виду `{ ok, error? }`, тож ця логіка жила в трьох копіях і тепер спільна.
 */
export function useLeadForm<T extends Record<string, string>>({
  endpoint,
  initialValues,
  buildPayload,
  fallbackError,
  onSuccess,
}: UseLeadFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [status, setStatus] = useState<LeadFormStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof T>(field: K, value: T[K]) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function reset() {
    setValues(initialValues);
    setStatus("idle");
    setError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload ? buildPayload(values) : values),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(typeof data.error === "string" ? data.error : fallbackError);
        return;
      }

      setStatus("success");
      onSuccess?.();
    } catch {
      setStatus("error");
      setError("Проблема зі з'єднанням. Перевірте інтернет і спробуйте ще раз.");
    }
  }

  return { values, update, status, error, handleSubmit, reset };
}
