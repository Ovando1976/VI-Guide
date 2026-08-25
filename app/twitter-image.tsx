import { ImageResponse } from "next/og";

export const alt = "USVI Explorer — Your smart Virgin Islands travel companion";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          padding: "72px 82px",
          color: "white",
          background: "linear-gradient(145deg, #032F2D 0%, #0B6B64 58%, #1597A7 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -70,
            width: 430,
            height: 430,
            display: "flex",
            borderRadius: 999,
            background: "rgba(245, 196, 81, 0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 82,
            right: 102,
            width: 94,
            height: 94,
            display: "flex",
            borderRadius: 999,
            background: "#F5C451",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid rgba(197, 251, 245, 0.48)",
              borderRadius: 999,
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.08em",
            }}
          >
            VI
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 900, letterSpacing: "0.17em", color: "#F5C451" }}>
              USVI EXPLORER
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.72)" }}>
              St. Thomas · St. John · St. Croix
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 910 }}>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 0.96, fontWeight: 900, letterSpacing: "-0.045em" }}>
            Discover. Plan. Move through the USVI.
          </div>
          <div style={{ display: "flex", marginTop: 30, maxWidth: 830, fontSize: 27, lineHeight: 1.32, fontWeight: 650, color: "rgba(255,255,255,0.78)" }}>
            Beaches, stays, dining, activities, transportation and an AI concierge — connected in one local travel companion.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 800, letterSpacing: "0.05em", color: "#99F6E4" }}>
            usvi-explorer.com
          </div>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: "0.12em", color: "rgba(255,255,255,0.62)" }}>
            YOUR SMART ISLAND COMPANION
          </div>
        </div>
      </div>
    ),
    size,
  );
}
