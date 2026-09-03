"use client";

import { AnimatePresence, motion } from "framer-motion";
import Select from "./Select";
import { useLeadForm } from "@/lib/useLeadForm";
import {
  FormError,
  FormTextarea,
  Honeypot,
  NamePhoneFields,
  SubmitButton,
} from "./form";
import { CULTURES } from "@/lib/constants";

export default function ContactForm() {
  const { values, update, status, error, handleSubmit, reset } = useLeadForm({
    endpoint: "/api/send-notification",
    initialValues: { name: "", phone: "", culture: "", message: "", company: "" },
    fallbackError: "Не вдалося надіслати заявку. Спробуйте ще раз.",
  });

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
              onClick={reset}
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
            <Honeypot value={values.company} onChange={(v) => update("company", v)} />

            <NamePhoneFields
              name={values.name}
              phone={values.phone}
              onChange={(field, v) => update(field, v)}
            />

            <Select
              value={values.culture}
              onChange={(v) => update("culture", v)}
              options={CULTURES.map((c) => ({ value: c, label: c }))}
              placeholder="Культура — оберіть зі списку"
            />

            <FormTextarea
              rows={4}
              placeholder="Повідомлення"
              value={values.message}
              onChange={(e) => update("message", e.target.value)}
            />

            {error && <FormError>{error}</FormError>}

            <SubmitButton loading={status === "loading"}>Надіслати</SubmitButton>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
