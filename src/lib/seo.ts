import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

/** Build consistent per-page metadata from a single source of truth. */
export function createMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const url = new URL(path, siteConfig.url).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
