import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #1597A7 0%, #0E7490 52%, #062B3A 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 62,
            right: 62,
            width: 90,
            height: 90,
            display: "flex",
            borderRadius: 999,
            background: "#F5C451",
          }}
        />
        <div
          style={{
            width: 250,
            height: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "8px solid rgba(197, 251, 245, 0.48)",
            borderRadius: 999,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <div style={{ display: "flex", fontSize: 112, fontWeight: 900, letterSpacing: "-0.08em", lineHeight: 1 }}>
              VI
            </div>
            <div style={{ display: "flex", marginTop: 8, fontSize: 23, fontWeight: 800, letterSpacing: "0.2em", color: "#F5C451" }}>
              EXPLORE
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 50,
            right: 50,
            bottom: 54,
            height: 14,
            display: "flex",
            borderRadius: 999,
            background: "rgba(153, 246, 228, 0.88)",
          }}
        />
      </div>
    ),
    size,
  );
}
