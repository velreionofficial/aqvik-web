import type { Metadata } from "next";

import { GstInvoiceTool } from "@/components/tools/gst/gst-invoice-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { gstCopy, gstFaqs, gstInvoiceTool as tool } from "@/content/gst-invoice";

export const metadata: Metadata = {
  title: { absolute: tool.title },
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: { title: tool.title, description: tool.description, url: `/tools/${tool.slug}` },
};

export default function GstInvoiceGeneratorPage() {
  return (
    <ToolPage
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
