import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { EmiCalculator } from "@/components/tools/emi-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { emiTool as tool } from "@/content/tools";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

export default function EMICalculatorPage() {
  return (
    <ToolPage
      slug={tool.slug}
      h1={tool.h1}
      intro={tool.intro}
      how={tool.how}
      faqs={tool.faqs}
    >
      <EmiCalculator />
    </ToolPage>
  );
}
