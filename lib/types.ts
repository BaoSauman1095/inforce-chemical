export type CatalogTab = "seeds" | "fert" | "prot";

export interface CatalogItem {
  name: string;
  brand: string;
  packs: string[];
  price?: number;
  unit?: string;
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
