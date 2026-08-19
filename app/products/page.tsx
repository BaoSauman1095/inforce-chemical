import type { Metadata } from "next";
import Catalog from "@/components/Catalog";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Каталог продукції",
  description: `Повний каталог насіння, добрив та засобів захисту рослин — ${SITE_NAME}.`,
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <div className="pt-8 md:pt-12">
      <Catalog />
    </div>
  );
}
