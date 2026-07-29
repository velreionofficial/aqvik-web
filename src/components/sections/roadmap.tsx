import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { roadmap } from "@/content/home";
import { cn } from "@/lib/utils";

export function Roadmap() {
  return (
    <Section
      id="roadmap"
      label="Sequence"
      title="What is built, and what comes after"
      description="Order matters here: each stage depends on the ledger underneath it being correct first. Dates are deliberately absent — we will publish them when they are commitments rather than hopes."
    >
      <ol className="relative border-l border-hairline pl-8 sm:pl-12">
        {roadmap.map((stage, index) => (
          <Reveal as="li" key={stage.title} delay={index * 0.05} className="relative pb-12 last:pb-0">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-8 top-2 size-2 -translate-x-1/2 rounded-full sm:-left-12",
                stage.status === "Building" ? "bg-primary" : "bg-muted-dim",
              )}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={stage.status === "Building" ? "accent" : "outline"}>
                {stage.marker}
              </Badge>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-dim">
                {stage.status}
              </span>
            </div>
            <h3 className="mt-4 text-display-sm">{stage.title}</h3>
            <p className="mt-3 max-w-measure text-[0.9375rem] leading-relaxed text-muted">
              {stage.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {stage.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-muted-dim"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
