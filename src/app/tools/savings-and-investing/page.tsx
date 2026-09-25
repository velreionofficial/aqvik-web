import type { Metadata } from "next";

import { ToolGroupPage } from "@/components/tools/tool-group-page";
import { findGroup } from "@/content/tool-groups";
import { toolMetadata } from "@/lib/seo";

const group = findGroup("savings");

export const metadata: Metadata = toolMetadata({
  title: group.metaTitle,
  description: group.metaDescription,
  path: `/tools/${group.slug}`,
});

export default function Page() {
  return <ToolGroupPage id="savings" />;
}
