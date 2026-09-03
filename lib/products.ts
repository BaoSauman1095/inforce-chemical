import { CATALOG, CATALOG_TABS } from "./catalog-data";
import type { FlatCatalogItem } from "./types";
import { packTotalPrice } from "./utils";

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

export interface ResolvedOrderLine {
  name: string;
  brand: string;
  packLabel: string;
  quantity: number;
  /** Сума за одну упаковку, або null для позицій «ціна за запитом». */
  unitPrice: number | null;
  /** unitPrice × quantity, або null. */
  total: number | null;
}

/**
 * Перетворює позиції з запиту на рядки замовлення, беручи назви та ціни з
 * каталогу — клієнт надсилає лише slug, упаковку й кількість, тож підмінити
 * ціну в запиті неможливо. Невідомі slug чи упаковки просто відкидаються.
 */
export function resolveOrderItems(
  items: Array<{ slug: string; packLabel: string; quantity: number }>
): ResolvedOrderLine[] {
  return items.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    if (!product) return [];
    const pack = product.packs.find((p) => p.label === item.packLabel);
    if (!pack) return [];

    const unitPrice = packTotalPrice(pack, product.unit);
    return [
      {
        name: product.name,
        brand: product.brand,
        packLabel: pack.label,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice === null ? null : unitPrice * item.quantity,
      },
    ];
  });
}
