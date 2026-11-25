import { ImageResponse } from "next/og";

export const alt = "X Algorithm Scroll";
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
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#faf8f5",
          color: "#1d1b18",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#6b645a" }}>X Algorithm Scroll</div>
        <div style={{ display: "flex", fontSize: 80, lineHeight: 1.05, fontWeight: 700 }}>
          The For You code, one card at a time
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#6b645a" }}>
          <span>Real lines from xai-org/x-algorithm</span>
          <span>built with Grok Bot</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
