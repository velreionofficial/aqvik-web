import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { ToolsSearch, type ToolSection } from "@/components/tools/tools-search";
import { toolGroups } from "@/content/tool-groups";
import { toolsIndex } from "@/content/tools";
import { toolMetadata } from "@/lib/seo";

export const metadata: Metadata = toolMetadata({
  title: toolsIndex.title,
  description: toolsIndex.description,
  path: "/tools",
});

export default function ToolsIndexPage() {
  const sections: ToolSection[] = toolGroups.map((group) => ({
    id: group.id,
    slug: group.slug,
    title: group.title,
    description: group.description,
    cards: group.tools,
  }));

  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <h1 className="max-w-[20ch] text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {toolsIndex.h1}
        </h1>
        <p className="mt-5 max-w-measure text-lead text-muted">{toolsIndex.intro}</p>
        <ToolsSearch sections={sections} />
      </div>
    </Container>
  );
}
