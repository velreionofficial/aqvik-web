import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { StatementAnalyzer } from "@/components/tools/statement/statement-analyzer";
import { ToolPage } from "@/components/tools/tool-page";
import { statementCopy, statementFaqs, statementTool as tool } from "@/content/statement-analyzer";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

const how = [
  "The file is read by your browser. CSV and Excel files are read directly; PDFs are read with pdf.js, which places each piece of text by its position to rebuild the table.",
  "The header row (Date, Description, Debit, Credit, Balance and similar names) tells which column is which. You can change any column before the analysis.",
  "Rows without a date are joined to the transaction above (long descriptions) or ignored (totals and page headers).",
  "Categories come from words in the description; payees come from the UPI or transfer details in it. Both are best guesses you can change.",
  "A payment repeats monthly when the same payee is debited about the same amount (within 15%) about a month apart, in at least two months, or three for statements of three months or more.",
  "All sums are exact to the paisa; percentages are rounded for display.",
];

export default function Page() {
  return (
    <ToolPage slug={tool.slug} h1={tool.h1} intro={tool.intro} how={how} faqs={statementFaqs} disclaimer={statementCopy.disclaimer} softCta={statementCopy.cta}>
      <StatementAnalyzer />
    </ToolPage>
  );
}
