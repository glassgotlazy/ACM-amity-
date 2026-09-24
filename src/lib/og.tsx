import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * The font is read from disk once and cached for the life of the process.
 *
 * `new URL(..., import.meta.url)` looks like the tidier option but resolves to
 * a bundled static path that `fetch` cannot parse in the Node runtime. Reading
 * the file directly works, provided `outputFileTracingIncludes` in
 * next.config.mjs ships src/assets with these routes — without that it renders
 * locally and 500s on a serverless deploy, where the file was never uploaded.
 */
let fontCache: Buffer | null = null;

async function interSemiBold(): Promise<Buffer> {
  if (!fontCache) {
    fontCache = await readFile(join(process.cwd(), "src/assets/Inter-SemiBold.ttf"));
  }
  return fontCache;
}

const VOID = "#08090B";
const INK = "#F4F5F7";
const MUTED = "#8F96A4";
const ACCENT = "#E5342B";

type Props = {
  /** Small uppercase label above the headline, e.g. "PROBLEM 01". */
  eyebrow: string;
  title: string;
  /** Optional supporting line under the rule. */
  footnote?: string;
};

type Brand = { short: string; caption: string };

/**
 * One card for every shareable surface. Satori supports a subset of CSS —
 * flexbox only, no grid — so the layout is deliberately built from stacked
 * flex rows rather than the site's own grid classes.
 */
export async function renderOgImage({ eyebrow, title, footnote }: Props, brand: Brand) {
  // Long problem titles need to step down a size or they overflow the card.
  const fontSize = title.length > 46 ? 68 : title.length > 30 ? 84 : 100;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: VOID,
          padding: "72px 80px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 30, color: INK, letterSpacing: "-0.03em" }}>{brand.short}</div>
          <div style={{ width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.22)" }} />
          <div style={{ fontSize: 19, color: MUTED, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {brand.caption}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: ACCENT,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 26,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              fontSize,
              lineHeight: 1.02,
              color: INK,
              letterSpacing: "-0.04em",
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", height: 3, width: 96, backgroundColor: ACCENT, marginBottom: 26 }} />
          <div style={{ display: "flex", fontSize: 24, color: MUTED, letterSpacing: "-0.01em" }}>
            {footnote ?? "Real problems. Real projects. Real technical experience."}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Inter", data: await interSemiBold(), style: "normal", weight: 600 }],
    },
  );
}
