"use client";

import { useState } from "react";
import Modal from "./Modal";
import AddToCartButton from "./AddToCartButton";
import ProductQuestionForm from "./ProductQuestionForm";
import type { FlatCatalogItem } from "@/lib/types";

export default function ProductActions({
  product,
  packLabel,
}: {
  product: FlatCatalogItem;
  /** Упаковка, обрана на сторінці товару. */
  packLabel?: string;
}) {
  const [questionOpen, setQuestionOpen] = useState(false);

  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <AddToCartButton product={product} packLabel={packLabel} />
      <button
        type="button"
        onClick={() => setQuestionOpen(true)}
        className="rounded-[11px] border border-brand px-6 py-3.5 font-heading text-[14px] font-bold tracking-wide text-brand transition-colors hover:bg-brand hover:text-white"
      >
        Задати питання про товар
      </button>

      <Modal
        open={questionOpen}
        onClose={() => setQuestionOpen(false)}
        title="Задати питання про товар"
      >
        <ProductQuestionForm product={product} />
      </Modal>
    </div>
  );
}
