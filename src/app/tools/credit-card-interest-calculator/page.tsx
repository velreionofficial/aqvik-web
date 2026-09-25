import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { CreditCardCalculator } from "@/components/tools/credit-card-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { moneyToolCta, moneyToolDisclaimer, creditCardTool as tool } from "@/content/tools";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

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
      related={[{ href: "/tools/loan-prepayment-calculator", label: "Paying off a loan early? See how much interest you save" }]}
    >
      <CreditCardCalculator />
    </ToolPage>
  );
}
