import type { Metadata } from "next";

import { EmiCalculator } from "@/components/tools/emi-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { emiTool as tool } from "@/content/tools";

export const metadata: Metadata = {
  title: { absolute: tool.title },
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: { title: tool.title, description: tool.description, url: `/tools/${tool.slug}` },
};

export default function EMICalculatorPage() {
  return (
    <ToolPage h1={tool.h1} intro={tool.intro} how={tool.how} faqs={tool.faqs}>
      <EmiCalculator />
    </ToolPage>
  );
}
