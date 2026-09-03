const ROWS = 12;
const TEXT = Array(6).fill("IN FORCE CHEMICAL").join(" · ");

/**
 * Decorative repeating diagonal watermark behind the whole page. Purely visual.
 *
 * Clips itself rather than relying on `overflow-hidden` on a page-level
 * wrapper: such a wrapper also becomes the scroll container for the sticky
 * header, which silently stops it sticking.
 */
export default function WatermarkBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
    >
      <div className="absolute inset-[-30%] flex -rotate-[24deg] flex-col gap-[22px]">
        {Array.from({ length: ROWS }).map((_, i) => (
          <div
            key={i}
            className="watermark-row text-[62px] leading-none"
            style={{
              color: i % 2 === 0 ? "rgba(255,255,255,.022)" : "rgba(139,26,43,.055)",
              marginLeft: `${((i * 53) % 9) * 40 - 160}px`,
            }}
          >
            {TEXT}
          </div>
        ))}
      </div>
    </div>
  );
}
