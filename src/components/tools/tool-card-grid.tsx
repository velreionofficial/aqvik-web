import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolEntry } from "@/content/tool-groups";

/** Tool cards used on a group page. */
export function ToolCardGrid({ tools }: { tools: readonly ToolEntry[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <li key={tool.slug}>
          <Link
            href={`/tools/${tool.slug}`}
            className="glass group flex h-full flex-col rounded-2xl p-6 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-7"
          >
            <h2 className="text-[1.125rem] font-medium text-foreground">{tool.name}</h2>
            <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{tool.cardLine}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary-soft">
              {tool.action}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
