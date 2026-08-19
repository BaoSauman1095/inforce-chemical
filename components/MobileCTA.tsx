import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";

/** Fixed bottom call-to-action, visible only on small screens (< md). */
export default function MobileCTA() {
  return (
    <a
      href={`tel:${PHONE_TEL}`}
      className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2.5 rounded-2xl bg-brand px-4 py-[17px] font-heading text-base font-bold tracking-wide text-white shadow-[0_12px_34px_rgba(0,0,0,.6)] md:hidden"
    >
      Подзвонити {PHONE_DISPLAY}
    </a>
  );
}
