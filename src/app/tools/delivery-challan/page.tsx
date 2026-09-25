import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { DeliveryChallanTool } from "@/components/tools/gstdoc/delivery-challan-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { challanCopy, challanFaqs, deliveryChallanTool as tool } from "@/content/gst-docs";

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
      faqs={challanFaqs}
      disclaimer={challanCopy.disclaimer}
      softCta={challanCopy.cta}
    >
      <DeliveryChallanTool />
    </ToolPage>
  );
}
