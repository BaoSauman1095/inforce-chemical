import Image from "next/image";
import ImagePlaceholder from "./ImagePlaceholder";
import { productPhotoSrc } from "@/lib/product-images";

/**
 * Product identity strip shown at the top of the order/question modals —
 * photo + brand + name, so it's obvious at a glance which product the form
 * refers to instead of a plain text line.
 */
export default function ProductLeadCard({ name, brand, slug }: { name: string; brand: string; slug: string }) {
  const photoSrc = productPhotoSrc(slug);

  return (
    <div className="flex items-center gap-3.5 rounded-[14px] bg-brand/[.06] p-3">
      <div className="relative h-16 w-16 flex-none overflow-hidden rounded-[10px] bg-white">
        {photoSrc ? (
          <Image src={photoSrc} alt={name} fill sizes="64px" className="object-contain p-1.5" />
        ) : (
          <ImagePlaceholder label={name} compact className="h-16 w-16" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-brand">{brand}</p>
        <p className="truncate font-heading text-[15px] font-bold leading-tight text-[#141414]">{name}</p>
      </div>
    </div>
  );
}
