"use client";

import { useState } from "react";
import Image from "next/image";
import ImagePlaceholder from "./ImagePlaceholder";
import Modal from "./Modal";
import { productPhotoSrc } from "@/lib/product-images";

interface ProductGalleryProps {
  name: string;
  slug: string;
  images?: string[];
}

export default function ProductGallery({ name, slug, images }: ProductGalleryProps) {
  const label = images && images.length > 0 ? images[0] : "Фото товару";
  const photoSrc = productPhotoSrc(slug);
  const [zoomed, setZoomed] = useState(false);

  if (photoSrc) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="relative block h-[280px] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-white text-left sm:h-[360px]"
          aria-label="Збільшити фото"
        >
          <Image src={photoSrc} alt={name} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-contain p-6" />
        </button>

        <Modal open={zoomed} onClose={() => setZoomed(false)} title={name}>
          <div className="relative h-[50vh] w-full bg-white">
            <Image src={photoSrc} alt={name} fill sizes="90vw" className="object-contain p-6" />
          </div>
        </Modal>
      </div>
    );
  }

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
