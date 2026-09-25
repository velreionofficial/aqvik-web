import type { Metadata } from "next";

import { toolMetadata } from "@/lib/seo";import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { gstInvoiceTool } from "@/content/gst-invoice";
import { moneyTools, tools, toolsIndex } from "@/content/tools";

export const metadata: Metadata = toolMetadata({
  title: toolsIndex.title,
  description: toolsIndex.description,
  path: "/tools",
});

export default function ToolsIndexPage() {
  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <h1 className="max-w-[20ch] text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {toolsIndex.h1}
        </h1>
        <p className="mt-5 max-w-measure text-lead text-muted">{toolsIndex.intro}</p>

        <ul className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...tools, ...moneyTools, gstInvoiceTool].map((tool) => (
            <li key={tool.slug}>
              <Link
                href={`/tools/${tool.slug}`}
                className="glass group flex h-full flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-7"
              >
                <h2 className="text-[1.125rem] font-medium text-foreground">{tool.name}</h2>
                <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{tool.cardLine}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary-soft">
                  {tool.slug === gstInvoiceTool.slug ? "Open generator" : "Open calculator"}
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
