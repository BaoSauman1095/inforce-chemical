import { z } from "zod";

// Ukrainian mobile numbers with optional country code, spaces/dashes allowed.
const PHONE_REGEX = /^(\+?380|0)\d{9}$/;

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Вкажіть ім'я (мінімум 2 символи)")
    .max(80, "Ім'я занадто довге"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-()]/g, ""))
    .refine((v) => PHONE_REGEX.test(v), {
      message: "Введіть коректний номер телефону, напр. 0671234567",
    }),
  culture: z.string().trim().max(80).optional().default(""),
  message: z
    .string()
    .trim()
    .max(1000, "Повідомлення занадто довге")
    .optional()
    .default(""),
  // Honeypot field: real users never fill this in, bots usually do. No length
  // constraint here on purpose — the route handler checks it after parsing
  // and short-circuits to a fake "success" instead of a 422 that would tip
  // off simple bots that the field is being watched.
  company: z.string().optional().default(""),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

const phoneField = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => PHONE_REGEX.test(v), {
    message: "Введіть коректний номер телефону, напр. 0671234567",
  });

export const productOrderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Вкажіть ім'я (мінімум 2 символи)")
    .max(80, "Ім'я занадто довге"),
  phone: phoneField,
  quantity: z.coerce
    .number({ invalid_type_error: "Вкажіть кількість" })
    .int("Кількість має бути цілим числом")
    .min(1, "Кількість має бути не менше 1")
    .max(10000, "Занадто велика кількість"),
  packSize: z.string().trim().min(1, "Оберіть розмір упаковки").max(40),
  productName: z.string().trim().min(1).max(160),
  productSlug: z.string().trim().min(1).max(160),
  company: z.string().optional().default(""),
});

export type ProductOrderInput = z.infer<typeof productOrderSchema>;

export const productQuestionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Вкажіть ім'я (мінімум 2 символи)")
    .max(80, "Ім'я занадто довге"),
  phone: phoneField,
  question: z
    .string()
    .trim()
    .min(3, "Питання занадто коротке")
    .max(1000, "Питання занадто довге"),
  productName: z.string().trim().min(1).max(160),
  productSlug: z.string().trim().min(1).max(160),
  company: z.string().optional().default(""),
});

export type ProductQuestionInput = z.infer<typeof productQuestionSchema>;
