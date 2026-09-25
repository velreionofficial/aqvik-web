import type { Metadata } from "next";

import { GstCalculator } from "@/components/tools/gst-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { moneyToolCta, moneyToolDisclaimer, gstCalcTool as tool } from "@/content/tools";

export const metadata: Metadata = {
  title: { absolute: tool.title },
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: { title: tool.title, description: tool.description, url: `/tools/${tool.slug}` },
};

export default function Page() {
  return (
    <ToolPage
      h1={tool.h1}
      intro={tool.intro}
      how={tool.how}
      faqs={tool.faqs}
      disclaimer={moneyToolDisclaimer}
      note={tool.note}
      cta={moneyToolCta}
      related={[{ href: "/tools/gst-invoice-generator", label: "Need a full tax invoice? Use the GST invoice generator" }]}
    >
      <GstCalculator />
    </ToolPage>
  );
}
