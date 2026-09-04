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

export interface PackOption {
  /** Displayed size label, e.g. "5 л" or "25 кг". */
  label: string;
  /** Per-unit price (грн) when this specific pack size is selected. */
  price?: number;
}

export interface CatalogItem {
  /** Stable, URL-safe identifier — used as the /products/[slug] route param. */
  slug: string;
  name: string;
  brand: string;
  packs: PackOption[];
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
  /** Тимчасово знято з продажу (немає в чинному прайсі) — прибирається з каталогу й /products/[slug] нижче, дані лишаються для швидкого повернення. */
  hidden?: boolean;
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
