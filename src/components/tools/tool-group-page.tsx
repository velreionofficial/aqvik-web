import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ToolCardGrid } from "@/components/tools/tool-card-grid";
import { findGroup, toolGroups } from "@/content/tool-groups";

/** /tools/<group>: the group's tools as cards, and links to the other groups. */
export function ToolGroupPage({ id }: { id: string }) {
  const group = findGroup(id);
  const others = toolGroups.filter((g) => g.id !== id);
  return (
    <Container>
      <div className="pb-20 pt-10 lg:pb-28 lg:pt-16">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted-dim">
          <Link href="/tools" className="rounded-sm hover:text-foreground">
            Tools
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-muted">{group.title}</span>
        </nav>
        <h1 className="mt-5 max-w-[20ch] text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
          {group.title}
        </h1>
        <p className="mt-5 max-w-measure text-lead text-muted">{group.description}</p>
        <p className="mt-2 text-sm text-muted-dim">
          {group.tools.length} free tools · Nothing you enter is sent or stored.
        </p>

        <div className="mt-10">
          <ToolCardGrid tools={group.tools} />
        </div>

        <section aria-labelledby="other-groups" className="mt-16">
          <h2 id="other-groups" className="text-sm font-medium text-muted">
            Other tools
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/tools/${g.slug}`}
                  className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-muted transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {g.title} · {g.tools.length}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/tools"
                className="inline-flex rounded-full px-4 py-2 text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                All tools →
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </Container>
  );
}
