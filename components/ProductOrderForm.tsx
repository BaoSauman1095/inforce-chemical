"use client";

import { useState, type FormEvent } from "react";
import ProductLeadCard from "./ProductLeadCard";
import type { FlatCatalogItem } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

interface ProductOrderFormProps {
  product: FlatCatalogItem;
}

export default function ProductOrderForm({ product }: ProductOrderFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    quantity: "1",
    packSize: product.packs[0]?.label ?? "",
    company: "", // honeypot — should always stay empty
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/product-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productName: product.name,
          productSlug: product.slug,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "Не вдалося надіслати замовлення. Спробуйте ще раз.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setError("Проблема зі з'єднанням. Перевірте інтернет і спробуйте ще раз.");
    }
  }

  if (status === "success") {
    return (
      <div>
        <p className="font-heading text-[17px] font-bold text-brand">Дякуємо, замовлення прийнято</p>
        <p className="mt-2 text-sm leading-relaxed text-[#5f5b58]">
          Менеджер зв&apos;яжеться з вами найближчим часом для підтвердження замовлення.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
      {/*
        Honeypot field — hidden from real users, catches naive bots.
        Uses `display: none` rather than off-screen positioning: autofill/
        password-manager extensions can still find and fill absolutely-
        positioned "invisible" inputs, which silently makes the form report
        fake success for a real visitor. `display: none` is reliably skipped
        by autofill.
      */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={form.company}
        onChange={(e) => update("company", e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <ProductLeadCard name={product.name} brand={product.brand} slug={product.slug} />

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

      <div className="flex gap-3">
        <input
          type="number"
          required
          min={1}
          max={10000}
          placeholder="Кількість"
          value={form.quantity}
          onChange={(e) => update("quantity", e.target.value)}
          className="w-1/2 rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none focus:border-brand"
        />
        <select
          required
          value={form.packSize}
          onChange={(e) => update("packSize", e.target.value)}
          className="w-1/2 rounded-[11px] border border-[#dcd8d5] bg-white px-4 py-3.5 text-[15px] text-[#141414] outline-none focus:border-brand"
        >
          {product.packs.map((pack) => (
            <option key={pack.label} value={pack.label}>
              {pack.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex items-center justify-center gap-2 rounded-[11px] bg-brand px-6 py-4 font-heading text-[15px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Надсилаємо…
          </>
        ) : (
          "Надіслати замовлення"
        )}
      </button>
    </form>
  );
}
