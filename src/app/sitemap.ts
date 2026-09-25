import type { MetadataRoute } from "next";

import { siteConfig } from "@/content/site";

const routes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/delete-account", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/tools", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/emi-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/sip-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/swp-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/gst-invoice-generator", priority: 0.8, changeFrequency: "monthly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: new URL(route.path, siteConfig.url).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
