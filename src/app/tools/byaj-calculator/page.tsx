import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { ByajCalculator } from "@/components/tools/byaj-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { byajCopy, byajFaqs, byajTool as tool } from "@/content/byaj";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

const how = [
  "Rupaye sainkda is interest per ₹100 per month, so the yearly rate is that figure × 12 (2 rupaye sainkda = 24% a year). ₹ per ₹1,000 per month × 1.2 gives the yearly %.",
  "Months + days: interest = amount × yearly rate ÷ 100 × (whole months + leftover days ÷ 30) ÷ 12. Exact days: interest = amount × yearly rate ÷ 100 × days ÷ 365.",
  "Byaj par byaj: on each chosen date (every year, 6 months or month from the date given), unpaid interest is added to the amount and earns interest from then on.",
  "On a repayment date, the interest up to that day is worked out first; the repayment clears it, and the rest reduces the amount.",
  "Each period's interest is rounded to the paisa when it is added, so every line of the hisaab adds up.",
];

export default function Page() {
  return (
    <ToolPage slug={tool.slug} h1={tool.h1} intro={tool.intro} how={how} faqs={byajFaqs} disclaimer={byajCopy.disclaimer} softCta={byajCopy.cta}>
      <ByajCalculator />
    </ToolPage>
  );
}
