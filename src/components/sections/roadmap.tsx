import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { roadmap } from "@/content/home";
import { cn } from "@/lib/utils";

function Column({
  title,
  note,
  items,
  accent,
}: {
  title: string;
  note?: string;
  items: readonly string[];
  accent: boolean;
}) {
  return (
    <div className="glass h-full rounded-2xl p-6 sm:p-8">
      <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-display-sm">{title}</span>
        {note ? <span className="font-mono text-xs text-muted-dim">{note}</span> : null}
      </h3>
      <ul className="mt-6 space-y-3.5">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-[0.55rem] size-1.5 rounded-full",
                accent ? "bg-primary" : "bg-muted-dim",
              )}
            />
            <span className="text-[0.9375rem] leading-relaxed text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Roadmap() {
  return (
    <Section id="roadmap" title={roadmap.heading} description={roadmap.intro}>
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal className="h-full">
          <Column {...roadmap.built} accent />
        </Reveal>
        <Reveal delay={0.06} className="h-full">
          <Column {...roadmap.next} accent={false} />
        </Reveal>
      </div>
    </Section>
  );
}
