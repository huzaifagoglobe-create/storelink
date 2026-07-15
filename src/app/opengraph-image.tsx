import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "StoreLink — your own online shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #8E2C5A 0%, #5A1B39 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, opacity: 0.85 }}>StoreLink</div>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, marginTop: 16 }}>
          Your own online shop
        </div>
        <div style={{ fontSize: 36, opacity: 0.9, marginTop: 24 }}>
          Take orders on WhatsApp · Cash on Delivery
        </div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <div style={{ background: "#F2A93B", color: "#5A3A0A", fontSize: 30, fontWeight: 600, padding: "12px 28px", borderRadius: 14 }}>
            storelink.pk
          </div>
        </div>
      </div>
    ),
    size
  );
}
