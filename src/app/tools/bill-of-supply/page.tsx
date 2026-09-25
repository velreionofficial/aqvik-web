import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { BillOfSupplyTool } from "@/components/tools/gstdoc/bill-of-supply-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { bosCopy, bosFaqs, billOfSupplyTool as tool } from "@/content/gst-docs";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

export default function Page() {
  return (
    <ToolPage
      slug={tool.slug}
      h1={tool.h1}
      intro={tool.intro}
      faqs={bosFaqs}
      disclaimer={bosCopy.disclaimer}
      softCta={bosCopy.cta}
    >
      <BillOfSupplyTool />
    </ToolPage>
  );
}
