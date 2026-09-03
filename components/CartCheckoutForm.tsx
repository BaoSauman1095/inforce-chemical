"use client";

import { useCart } from "./CartProvider";
import { useLeadForm } from "@/lib/useLeadForm";
import {
  FormError,
  FormSuccess,
  Honeypot,
  NamePhoneFields,
  SubmitButton,
} from "./form";

/** Оформлення замовлення: ім'я, телефон і кнопка — решту уточнює менеджер. */
export default function CartCheckoutForm() {
  const { lines, clear } = useCart();

  const { values, update, status, error, handleSubmit } = useLeadForm({
    endpoint: "/api/cart-order",
    initialValues: { name: "", phone: "", company: "" },
    fallbackError: "Не вдалося надіслати замовлення. Спробуйте ще раз.",
    buildPayload: (v) => ({
      ...v,
      items: lines.map((l) => ({
        slug: l.slug,
        packLabel: l.packLabel,
        quantity: l.quantity,
      })),
    }),
    // Кошик чистимо лише після підтвердженої відправки, щоб при помилці
    // мережі позиції не зникли разом із замовленням.
    onSuccess: clear,
  });

  if (status === "success") {
    return (
      <FormSuccess title="Дякуємо, замовлення прийнято">
        Менеджер зв&apos;яжеться з вами найближчим часом для підтвердження
        замовлення та умов доставки.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
      <Honeypot value={values.company} onChange={(v) => update("company", v)} />

      <NamePhoneFields
        name={values.name}
        phone={values.phone}
        onChange={(field, v) => update(field, v)}
      />

      {error && <FormError>{error}</FormError>}

      <SubmitButton loading={status === "loading"} disabled={lines.length === 0}>
        Оформити замовлення
      </SubmitButton>
    </form>
  );
}
