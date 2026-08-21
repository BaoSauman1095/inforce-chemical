/**
 * Slugs with a real photo in `public/products/{slug}.webp`. Everything else
 * still falls back to `ImagePlaceholder`. Add the slug here after dropping
 * the file in `public/products/`.
 */
export const PRODUCT_PHOTO_SLUGS = new Set([
  "baal-bt",
  "yevro-bt",
  "halop-bt",
  "kharvard",
  "klom-bt",
  "markiz-bt",
  "neitryn-bt",
  "prom-bt",
  "ritter-bt",
  "tizegold-bt",
  "adept-bt",
  "akonit-bt",
  "dzhenfild-bt",
  "hrano-bt",
  "karabas-bt",
  "lekar-bt",
  "melanzh-bt",
  "sole-bt",
  "apruv-bt",
  "bimol-bt",
  "dykhlor-bt",
  "klesso-bt",
  "straik-bt",
  "tor-bt",
  "imisid-bt",
  "kreator-bt",
  "zhar-bt",
  "fomover-bt",
  "stiker-bt",
  "miskorn-bt",
  "propley-bt",
  "forzats-bt",
]);

export function productPhotoSrc(slug: string): string | null {
  return PRODUCT_PHOTO_SLUGS.has(slug) ? `/products/${slug}.webp` : null;
}
