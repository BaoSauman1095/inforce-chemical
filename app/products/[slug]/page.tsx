import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { ALL_PRODUCTS, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface ProductPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return ALL_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return {};

  const title = `${product.name} — ${product.brand}`;
  const description =
    product.description ?? `${product.name} від ${product.brand}. ${product.group} — ${SITE_NAME}.`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: product.name }],
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);

  return <ProductDetail product={product} related={related} />;
}
