import { ImageResponse } from "next/og";
import { loadCards } from "@/lib/cards";

export const alt = "X Algorithm Scroll card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

/** Per-card share image: the title, the first real file path and lines, and the product name. */
export default async function Image({ params }: Props) {
  const { slug } = await params;
  const card = (await loadCards()).find((c) => c.slug === slug && c.verified);
  const first = card?.snippets[0];
  const where = first
    ? `${first.path}  L${first.startLine}${first.endLine > first.startLine ? `-L${first.endLine}` : ""}`
    : "";
  const title = card?.title ?? "X Algorithm Scroll";

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
        <div style={{ display: "flex", fontSize: 72, lineHeight: 1.1, fontWeight: 700 }}>{title}</div>
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: 26,
            color: "#8a4b1f",
            padding: "18px 22px",
            background: "#f0ece4",
            borderRadius: 12,
          }}
        >
          {where}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#6b645a" }}>
          <span>Defaults in the repo. Live settings can differ.</span>
          <span>built with Grok Bot</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
