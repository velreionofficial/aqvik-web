import type { Metadata } from "next";

import { FdCalculator } from "@/components/tools/fd-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { moneyToolCta, moneyToolDisclaimer, fdTool as tool } from "@/content/tools";

export const metadata: Metadata = {
  title: { absolute: tool.title },
  description: tool.description,
  alternates: { canonical: `/tools/${tool.slug}` },
  openGraph: { title: tool.title, description: tool.description, url: `/tools/${tool.slug}` },
};

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
      related={[{ href: "/tools/rd-calculator", label: "Saving every month instead? Try the RD calculator" }]}
    >
      <FdCalculator />
    </ToolPage>
  );
}
