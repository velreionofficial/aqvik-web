import type { MetadataRoute } from "next";

import { siteConfig } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    icons: [
      { src: "/brand/aqvik-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/aqvik-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
