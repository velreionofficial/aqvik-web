import type { MetadataRoute } from "next";

import { siteConfig } from "@/content/site";

const routes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/delete-account", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/tools", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/loans-and-credit", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/savings-and-investing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/business-and-gst", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/bills-and-receipts", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tools/emi-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/sip-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/swp-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/gst-invoice-generator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/gst-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/bill-maker", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/quotation-maker", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/bill-of-supply", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/delivery-challan", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/credit-debit-note", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/rent-receipt", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/loan-prepayment-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/credit-card-interest-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/fd-calculator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tools/rd-calculator", priority: 0.8, changeFrequency: "monthly" },
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
