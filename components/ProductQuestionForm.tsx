"use client";

import ProductLeadCard from "./ProductLeadCard";
import { useLeadForm } from "@/lib/useLeadForm";
import {
  FormError,
  FormSuccess,
  FormTextarea,
  Honeypot,
  NamePhoneFields,
  SubmitButton,
} from "./form";
import type { FlatCatalogItem } from "@/lib/types";

export default function ProductQuestionForm({ product }: { product: FlatCatalogItem }) {
  const { values, update, status, error, handleSubmit } = useLeadForm({
    endpoint: "/api/product-question",
    initialValues: { name: "", phone: "", question: "", company: "" },
    fallbackError: "Не вдалося надіслати питання. Спробуйте ще раз.",
    buildPayload: (v) => ({
      ...v,
      productName: product.name,
      productSlug: product.slug,
    }),
  });

  if (status === "success") {
    return (
      <FormSuccess title="Дякуємо, питання надіслано">
        Наш агроном зателефонує вам найближчим часом.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
      <Honeypot value={values.company} onChange={(v) => update("company", v)} />

      <ProductLeadCard name={product.name} brand={product.brand} slug={product.slug} />

      <NamePhoneFields
        name={values.name}
        phone={values.phone}
        onChange={(field, v) => update(field, v)}
      />

      <FormTextarea
        required
        rows={4}
        minLength={3}
        placeholder="Ваше питання про товар"
        value={values.question}
        onChange={(e) => update("question", e.target.value)}
      />

      {error && <FormError>{error}</FormError>}

      <SubmitButton loading={status === "loading"}>Надіслати питання</SubmitButton>
    </form>
  );
}
