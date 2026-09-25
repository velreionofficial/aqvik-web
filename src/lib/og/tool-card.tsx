import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/**
 * 1200 × 630 Open Graph card for a tool page, in the same style as the
 * site-wide card: dark background, logo, the tool name large, one line under
 * it, and the page address at the bottom.
 */
export const ogSize = { width: 1200, height: 630 };

const logo = readFileSync(join(process.cwd(), "public", "brand", "aqvik-icon-192.png")).toString("base64");

export function toolOgImage({ name, line, path }: { name: string; line: string; path: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050816",
          padding: "72px",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img> only */}
            <img src={`data:image/png;base64,${logo}`} alt="" width={64} height={64} style={{ borderRadius: "15px" }} />
            <div style={{ fontSize: 32, letterSpacing: "0.34em", fontWeight: 600 }}>AQVIK</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#050816",
              backgroundColor: "#22D3EE",
              borderRadius: "999px",
              padding: "8px 22px",
              fontWeight: 600,
            }}
          >
            Free tool
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1.05, letterSpacing: "-0.035em", fontWeight: 600 }}>
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#A8B3CF", maxWidth: "900px", lineHeight: 1.4 }}>{line}</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#7E8AA6",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "28px",
          }}
        >
          <span>aqvik.com{path}</span>
          <span>Runs in your browser · Nothing is stored</span>
        </div>
      </div>
    ),
    ogSize,
  );
}
