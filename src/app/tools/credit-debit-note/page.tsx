import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";
import { NoteTool } from "@/components/tools/gstdoc/note-tool";
import { ToolPage } from "@/components/tools/tool-page";
import { noteCopy, noteFaqs, noteTool as tool } from "@/content/gst-docs";

export const metadata: Metadata = toolMetadata({
  title: tool.title,
  description: tool.description,
  path: `/tools/${tool.slug}`,
});

export default function Page() {
  return (
    <ToolPage
      slug={tool.slug}
      h1={tool.h1}
      intro={tool.intro}
      faqs={noteFaqs}
      disclaimer={noteCopy.disclaimer}
      softCta={noteCopy.cta}
    >
      <NoteTool />
    </ToolPage>
  );
}
