import Image from "next/image";
import ImagePlaceholder from "./ImagePlaceholder";
import { productPhotoSrc } from "@/lib/product-images";

interface ProductGalleryProps {
  name: string;
  slug: string;
  images?: string[];
}

export default function ProductGallery({ name, slug, images }: ProductGalleryProps) {
  const label = images && images.length > 0 ? images[0] : "Фото товару";
  const photoSrc = productPhotoSrc(slug);

  if (photoSrc) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white">
        <Image
          src={photoSrc}
          alt={name}
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return <ImagePlaceholder label={`фото — ${label}`} className="aspect-square w-full rounded-2xl" />;
}
