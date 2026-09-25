import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { BillTool } from "@/components/tools/bill/bill-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { billCopy, billFaqs, billMakerTool as tool } from "@/content/bill-tools";

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
      faqs={billFaqs}
      disclaimer={billCopy.disclaimer}
      softCta={billCopy.cta}
    >
      <BillTool kind="bill" />
    </ToolPage>
  );
}
