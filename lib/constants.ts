export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://inforcechemical.ua";

export const SITE_NAME = "IN FORCE CHEMICAL";

export const PHONE_DISPLAY = process.env.NEXT_PUBLIC_PHONE ?? "0-800-33-10-80";
export const PHONE_TEL = process.env.NEXT_PUBLIC_PHONE_TEL ?? "0800331080";

export const SOCIALS = {
  instagram: "https://instagram.com/inforcechemical_",
  tiktok: "https://tiktok.com/@inforcechemical_",
  facebook: "https://facebook.com/inforcechemical",
  youtube: "https://youtube.com/@inforcechemical",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Головна" },
  { href: "#catalog", label: "Каталог продукції" },
  { href: "#partners", label: "Партнери" },
  { href: "#contacts", label: "Контакти" },
] as const;

export const CULTURES = [
  "Ріпак озимий",
  "Кукурудза",
  "Соя",
  "Соняшник",
  "Пшениця",
  "Цибуля",
  "Картопля",
  "Інше",
] as const;
