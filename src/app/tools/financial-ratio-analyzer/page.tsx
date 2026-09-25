import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { RatioAnalyzer } from "@/components/tools/ratios/ratio-analyzer";
import { ToolPage } from "@/components/tools/tool-page";
import { ratioDisclaimer, ratioFaqs, ratioHow, ratioSoftCta, ratioTool as tool } from "@/content/ratio-analyzer";

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
      how={ratioHow}
      faqs={ratioFaqs}
      disclaimer={ratioDisclaimer}
      softCta={ratioSoftCta}
    >
      <RatioAnalyzer />
    </ToolPage>
  );
}
