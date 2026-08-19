import { CATALOG, CATALOG_TABS } from "./catalog-data";
import type { FlatCatalogItem } from "./types";

/** Every catalog item flattened into a single list, indexed by slug for /products/[slug]. */
export const ALL_PRODUCTS: FlatCatalogItem[] = CATALOG_TABS.flatMap(({ key: tab }) =>
  CATALOG[tab].flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      group: group.title,
      icon: group.icon,
      tab,
      slotLabel: `фото — ${item.name}`,
    }))
  )
);

export function getProductBySlug(slug: string): FlatCatalogItem | undefined {
  return ALL_PRODUCTS.find((p) => p.slug === slug);
}

/** Same-group items first, padded out with same-tab items if the group is small. */
export function getRelatedProducts(product: FlatCatalogItem, limit = 4): FlatCatalogItem[] {
  const sameGroup = ALL_PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.group === product.group
  );
  if (sameGroup.length >= limit) return sameGroup.slice(0, limit);

  const sameGroupSlugs = new Set(sameGroup.map((p) => p.slug));
  const sameTab = ALL_PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.tab === product.tab && !sameGroupSlugs.has(p.slug)
  );

  return [...sameGroup, ...sameTab].slice(0, limit);
}
