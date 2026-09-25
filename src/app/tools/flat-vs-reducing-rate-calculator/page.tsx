import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { FlatRateCalculator } from "@/components/tools/flat-rate-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { flatRateTool as tool } from "@/content/flat-goal";
import { moneyToolCta, moneyToolDisclaimer } from "@/content/tools";

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
      disclaimer={moneyToolDisclaimer}
      note={tool.note}
      cta={moneyToolCta}
    >
      <FlatRateCalculator />
    </ToolPage>
  );
}
