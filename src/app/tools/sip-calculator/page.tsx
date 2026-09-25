import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { SipCalculator } from "@/components/tools/sip-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { sipTool as tool } from "@/content/tools";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

export default function SIPCalculatorPage() {
  return (
    <ToolPage h1={tool.h1} intro={tool.intro} how={tool.how} faqs={tool.faqs}>
      <SipCalculator />
    </ToolPage>
  );
}
