/**
 * Партнери з реальним логотипом у `public/partners/{file}`. Решта
 * рендериться текстовою назвою, як і раніше. Щоб додати логотип —
 * покладіть файл у `public/partners/` і впишіть його сюди за назвою
 * партнера (ключ = `name` з PARTNERS у `components/Partners.tsx`).
 */
export const PARTNER_LOGOS: Record<string, string> = {
  Limagrain: "/partners/limagrain.png",
  "Ocean Invest": "/partners/ocean-invest.png",
  Biolchim: "/partners/biolchim.png",
  Apsov: "/partners/apsov.png",
  Farmsaat: "/partners/farmsaat.png",
  "Himagro M": "/partners/himagro.png",
};

export function partnerLogoSrc(name: string): string | null {
  return PARTNER_LOGOS[name] ?? null;
}
