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
      h1={tool.h1}
      intro={tool.intro}
      how={tool.how}
      faqs={tool.faqs}
      related={[
        { href: "/tools/loan-prepayment-calculator", label: "Paying extra? See how much interest you save" },
        { href: "/tools/credit-card-interest-calculator", label: "Carrying a credit card balance? See what paying only the minimum costs" },
      ]}
    >
      <EmiCalculator />
    </ToolPage>
  );
}
