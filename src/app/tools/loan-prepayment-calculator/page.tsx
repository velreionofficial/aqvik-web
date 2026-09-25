import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { LoanPrepaymentCalculator } from "@/components/tools/loan-prepayment-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { moneyToolCta, moneyToolDisclaimer, prepaymentTool as tool } from "@/content/tools";

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
      related={[{ href: "/tools/credit-card-interest-calculator", label: "Carrying a credit card balance? See what paying only the minimum costs" }, { href: "/tools/emi-calculator", label: "Just need the EMI? Use the EMI calculator" }]}
    >
      <LoanPrepaymentCalculator />
    </ToolPage>
  );
}
