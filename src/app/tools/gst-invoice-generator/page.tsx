import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { GstInvoiceTool } from "@/components/tools/gst/gst-invoice-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { gstCopy, gstFaqs, gstInvoiceTool as tool } from "@/content/gst-invoice";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

export default function GstInvoiceGeneratorPage() {
  return (
    <ToolPage
      slug={tool.slug}
      h1={tool.h1}
      intro={tool.intro}
      faqs={gstFaqs}
      disclaimer={gstCopy.footerDisclaimer}
      softCta={gstCopy.cta}
    >
      <GstInvoiceTool />
    </ToolPage>
  );
}
