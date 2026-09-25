import { ogSize, toolOgImage } from "@/lib/og/tool-card";

export const alt = "Free financial tools — AQVIK";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage({
    name: "Free financial tools",
    line: "EMI, SIP, SWP, loan prepayment, credit card, FD, RD and GST calculators, and a GST invoice generator.",
    path: "/tools",
  });
}
