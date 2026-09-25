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

/**
 * Metadata for a /tools page. The page title already ends in "| AQVIK", so it
 * is used as-is. og:title, og:description and the Twitter card match the
 * page's own title and description, og:url is the page's own URL, and the
 * og:image comes from the opengraph-image file in the tool's folder.
 */
export function toolMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const url = new URL(path, siteConfig.url).toString();

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
