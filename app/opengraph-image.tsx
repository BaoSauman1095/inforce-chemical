import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0d0d0d",
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 40px)",
          color: "#f2f0ef",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#8B1A2B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            IF
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4 }}>
            IN FORCE CHEMICAL
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 54,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Все для врожаю — від насіння до збирання
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 26,
            color: "rgba(242,240,239,0.7)",
            maxWidth: 860,
          }}
        >
          Limagrain · Ocean Invest · Biolchim · Holland Farming
        </div>
      </div>
    ),
    { ...size }
  );
}
