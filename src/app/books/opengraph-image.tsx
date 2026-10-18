import { ogSize, toolOgImage } from "@/lib/og/tool-card";

export const alt = "Free books — AQVIK";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage({ name: "Free books", line: "Paise aur online suraksha ki kahaniyan, Hinglish mein. Bilkul free.", path: "/books" });
}
