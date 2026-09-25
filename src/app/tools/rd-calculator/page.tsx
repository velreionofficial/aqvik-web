import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { RdCalculator } from "@/components/tools/rd-calculator";
import { ToolPage } from "@/components/tools/tool-page";
import { moneyToolCta, moneyToolDisclaimer, rdTool as tool } from "@/content/tools";

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
      related={[{ href: "/tools/fd-calculator", label: "Have a lump sum? Try the FD calculator" }]}
    >
      <RdCalculator />
    </ToolPage>
  );
}
