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
      <div className="relative h-[380px] w-full overflow-hidden rounded-2xl bg-white sm:h-[480px]">
        <Image
          src={photoSrc}
          alt={name}
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-contain p-1"
          priority
        />
      </div>
    );
  }

  return <ImagePlaceholder label={`фото — ${label}`} className="h-[380px] w-full rounded-2xl sm:h-[480px]" />;
}
