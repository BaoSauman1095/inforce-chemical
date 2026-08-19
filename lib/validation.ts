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
