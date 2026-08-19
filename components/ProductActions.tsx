"use client";

import { useState } from "react";
import Modal from "./Modal";
import ProductOrderForm from "./ProductOrderForm";
import ProductQuestionForm from "./ProductQuestionForm";
import type { FlatCatalogItem } from "@/lib/types";

type ActiveModal = "order" | "question" | null;

export default function ProductActions({ product }: { product: FlatCatalogItem }) {
  const [modal, setModal] = useState<ActiveModal>(null);

  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => setModal("order")}
        className="rounded-[11px] bg-brand px-6 py-3.5 font-heading text-[14px] font-bold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover"
      >
        Замовити товар
      </button>
      <button
        type="button"
        onClick={() => setModal("question")}
        className="rounded-[11px] border border-brand px-6 py-3.5 font-heading text-[14px] font-bold tracking-wide text-brand transition-colors hover:bg-brand hover:text-white"
      >
        Задати питання про товар
      </button>

      <Modal open={modal === "order"} onClose={() => setModal(null)} title="Замовити товар">
        <ProductOrderForm product={product} />
      </Modal>
      <Modal open={modal === "question"} onClose={() => setModal(null)} title="Задати питання про товар">
        <ProductQuestionForm product={product} />
      </Modal>
    </div>
  );
}
