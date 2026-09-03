"use client";

import { useLeadForm } from "@/lib/useLeadForm";
import { FormError, Honeypot, NamePhoneFields, SubmitButton } from "./form";
import type { CartLine } from "./CartProvider";

interface CartCheckoutFormProps {
  lines: CartLine[];
  /** Замовлення прийнято сервером — далі кошик чистить і дякує панель. */
  onOrdered: () => void;
}

/** Оформлення замовлення: ім'я, телефон і кнопка — решту уточнює менеджер. */
export default function CartCheckoutForm({ lines, onOrdered }: CartCheckoutFormProps) {
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
    // Подяку показує панель: якщо малювати її тут, то очищення кошика
    // розмонтує форму разом із повідомленням, і людина його не побачить.
    onSuccess: onOrdered,
  });

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
        Надіслати замовлення
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-[#8a8582]">
        Менеджер зателефонує для підтвердження — оплата й доставка обговорюються
        по телефону.
      </p>
    </form>
  );
}
