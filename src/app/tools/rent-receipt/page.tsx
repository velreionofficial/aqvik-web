import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { RentReceiptTool } from "@/components/tools/rent/rent-receipt-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { rentCopy, rentFaqs, rentReceiptTool as tool } from "@/content/gst-docs";

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
      faqs={rentFaqs}
      disclaimer={rentCopy.disclaimer}
      softCta={rentCopy.cta}
    >
      <RentReceiptTool />
    </ToolPage>
  );
}
