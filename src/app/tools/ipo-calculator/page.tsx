import type { Metadata } from "next";
import Link from "next/link";

import { IpoCalculator } from "@/components/ipo/ipo-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { ipoCalculatorTool as tool, ipoCopy } from "@/content/ipo";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

export default function IpoCalculatorPage() {
  return (
    <ToolPage slug={tool.slug} h1={tool.h1} intro={tool.intro} how={tool.how} faqs={tool.faqs} disclaimer={ipoCopy.disclaimer} note={ipoCopy.noGmp}>
      <IpoCalculator />
      <p className="mt-6 text-[0.9375rem] text-muted">
        Dates, lot sizes and financials for current IPOs are on the{" "}
        <Link href="/ipo" className="text-primary-soft underline-offset-4 hover:underline">IPO calendar</Link>.
      </p>
    </ToolPage>
  );
}
