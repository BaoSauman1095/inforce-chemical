"use client";

import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";
import Modal from "./Modal";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  name: string;
  images?: string[];
}

const DEFAULT_SLOTS = ["Фото товару", "Етикетка", "Застосування в полі"];

export default function ProductGallery({ name, images }: ProductGalleryProps) {
  const slots = images && images.length > 0 ? images : DEFAULT_SLOTS;
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-2xl text-left"
        aria-label="Збільшити фото"
      >
        <ImagePlaceholder label={`фото — ${slots[active]}`} className="h-[280px] sm:h-[360px]" />
      </button>

      {slots.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {slots.map((slot, i) => (
            <button
              key={`${slot}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={slot}
              className={cn(
                "h-16 w-16 flex-none overflow-hidden rounded-lg ring-2 transition-colors",
                i === active ? "ring-brand" : "ring-transparent hover:ring-black/10"
              )}
            >
              <ImagePlaceholder label={slot} compact className="h-full w-full" />
            </button>
          ))}
        </div>
      )}

      <Modal open={zoomed} onClose={() => setZoomed(false)} title={name}>
        <ImagePlaceholder label={`фото — ${slots[active]}`} className="h-[50vh] w-full" />
      </Modal>
    </div>
  );
}
