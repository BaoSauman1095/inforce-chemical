export type CatalogTab = "seeds" | "fert" | "prot";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface DosageRow {
  crop: string;
  spectrum: string;
  rate: string;
  timing: string;
}

export interface CatalogItem {
  /** Stable, URL-safe identifier — used as the /products/[slug] route param. */
  slug: string;
  name: string;
  brand: string;
  packs: string[];
  price?: number;
  unit?: string;
  /** Short bold subheading shown under the price on the detail page. */
  tagline?: string;
  /** One-paragraph summary shown on the detail page and used as meta description. */
  description?: string;
  /** Longer free-form text for the detail page's "Опис товару" block. */
  fullDescription?: string;
  /** Photo slot labels for the gallery; falls back to generated defaults when omitted. */
  images?: string[];
  /** Plant-protection-specific spec fields (shown as the 3-column info block). */
  activeIngredient?: string;
  formulationType?: string;
  chemicalClass?: string;
  /** Generic spec fallback for seeds/fertilizers (maturity group, formula, etc). */
  specs?: ProductSpec[];
  crops?: string[];
  dosage?: DosageRow[];
  advantages?: string[];
}

export interface CatalogGroup {
  title: string;
  icon: string;
  items: CatalogItem[];
}

export type Catalog = Record<CatalogTab, CatalogGroup[]>;

export interface FlatCatalogItem extends CatalogItem {
  group: string;
  icon: string;
  tab: CatalogTab;
  slotLabel: string;
}
