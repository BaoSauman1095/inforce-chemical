"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CULTURES } from "@/lib/constants";

type Status = "idle" | "loading" | "success" | "error";

const initialForm = {
  name: "",
  phone: "",
  culture: "",
  message: "",
  company: "", // honeypot — should always stay empty
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Не вдалося надіслати заявку. Спробуйте ще раз.");
        return;
      }

      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
      setError("Проблема зі з'єднанням. Перевірте інтернет і спробуйте ще раз.");
    }
  }

  return (
    <div className="rounded-[18px] bg-card px-[30px] pb-[34px] pt-8 shadow-panelLg">
      <h3 className="font-heading text-2xl font-bold text-[#141414]">
        Задай питання агроному
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5f5b58]">
        Відповідаємо в робочі години, зазвичай того ж дня.
      </p>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 rounded-xl border border-brand/25 bg-brand/[.08] p-[22px]"
          >
            <p className="font-heading text-[17px] font-bold text-brand">
              Дякуємо, заявку прийнято
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#5f5b58]">
              Агроном зв&apos;яжеться з вами за вказаним номером.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm font-semibold text-brand underline underline-offset-2"
            >
              Надіслати ще одну заявку
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col gap-3.5"
            noValidate
          >
            {/* Honeypot field — hidden from real users, catches naive bots */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            <input
              type="text"
              required
              minLength={2}
              placeholder="Ім'я"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none focus:border-brand"
            />
            <input
              type="tel"
              required
              placeholder="Телефон, напр. 0671234567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none focus:border-brand"
            />
            <select
              value={form.culture}
              onChange={(e) => update("culture", e.target.value)}
              className="w-full rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none focus:border-brand"
            >
              <option value="">Культура — оберіть зі списку</option>
              {CULTURES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <textarea
              rows={4}
              placeholder="Повідомлення"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className="w-full resize-y rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none focus:border-brand"
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex items-center justify-center gap-2 rounded-[11px] bg-brand px-6 py-4 font-heading text-[15px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Надсилаємо…
                </>
              ) : (
                "Надіслати"
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
