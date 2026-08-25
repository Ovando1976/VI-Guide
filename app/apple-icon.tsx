import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
            top: 20,
            right: 20,
            width: 31,
            height: 31,
            display: "flex",
            borderRadius: 999,
            background: "#F5C451",
          }}
        />
        <div
          style={{
            width: 92,
            height: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid rgba(197, 251, 245, 0.52)",
            borderRadius: 999,
            color: "white",
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: "-0.08em",
          }}
        >
          VI
        </div>
        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 18,
            height: 5,
            display: "flex",
            borderRadius: 999,
            background: "rgba(153, 246, 228, 0.9)",
          }}
        />
      </div>
    ),
    size,
  );
}
