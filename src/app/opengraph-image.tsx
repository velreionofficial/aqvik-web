import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "AQVIK — Understand your money. Shape your tomorrow.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Inlined at build time so the card renders without a network fetch.
const logo = readFileSync(join(process.cwd(), "public", "brand", "aqvik-icon-192.png")).toString(
  "base64",
);

export default function OpengraphImage() {
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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img
            src={`data:image/png;base64,${logo}`}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: "15px" }}
          />
          <div style={{ fontSize: 32, letterSpacing: "0.34em", fontWeight: 600 }}>AQVIK</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex" }}>Money between friends,</div>
            <div style={{ display: "flex", color: "#22D3EE" }}>finally on one page.</div>
          </div>
          <div style={{ fontSize: 28, color: "#A8B3CF", maxWidth: "760px", lineHeight: 1.45 }}>
            One record for your money, and the money between friends.
          </div>
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
          <span>aqvik.com</span>
          <span>Closed beta — Android</span>
        </div>
      </div>
    ),
    size,
  );
}
