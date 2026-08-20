"use client";

import { useState } from "react";
import ImagePlaceholder from "./ImagePlaceholder";
import Modal from "./Modal";

interface ProductGalleryProps {
  name: string;
  images?: string[];
}

export default function ProductGallery({ name, images }: ProductGalleryProps) {
  const label = images && images.length > 0 ? images[0] : "Фото товару";
  const [zoomed, setZoomed] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="block w-full cursor-zoom-in overflow-hidden rounded-2xl text-left"
        aria-label="Збільшити фото"
      >
        <ImagePlaceholder label={`фото — ${label}`} className="h-[280px] sm:h-[360px]" />
      </button>

      <Modal open={zoomed} onClose={() => setZoomed(false)} title={name}>
        <ImagePlaceholder label={`фото — ${label}`} className="h-[50vh] w-full" />
      </Modal>
    </div>
  );
}
