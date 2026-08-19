import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  label: string;
  className?: string;
  compact?: boolean;
}

/**
 * Diagonal-stripe placeholder used wherever a real product/brand photo isn't
 * wired up yet. Drop in a real <Image> once assets are available — see
 * README "Заміна зображень-заглушок".
 */
export default function ImagePlaceholder({
  label,
  className,
  compact = false,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "grid place-items-center bg-[repeating-linear-gradient(135deg,#3a3634_0_9px,#454140_9px_18px)]",
        className
      )}
    >
      <span
        className={cn(
          "px-2 text-center font-mono uppercase tracking-[.1em] text-paper/40",
          compact ? "text-[9px]" : "text-[10.5px]"
        )}
      >
        {label}
      </span>
    </div>
  );
}
