import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { GstRateChanges } from "@/components/tools/gst-rate-changes";
import { ToolPage } from "@/components/tools/tool-page";
import { gstRatesDisclaimer, gstRatesTool as tool } from "@/content/tax";
import { moneyToolCta } from "@/content/tools";

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
      how={tool.how}
      faqs={tool.faqs}
      disclaimer={gstRatesDisclaimer}
      note={tool.note}
      cta={moneyToolCta}
    >
      <GstRateChanges />
    </ToolPage>
  );
}
