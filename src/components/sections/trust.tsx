import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { trustPillars } from "@/content/home";

export function Trust() {
  return (
    <Section
      id="trust"
      label="Standards"
      title="Money apps earn trust before anything else"
      description="These are commitments about how the product is built, not badges. Each one is testable, and each one holds from the first release."
    >
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2">
        {trustPillars.map((pillar, index) => {
          const Icon = pillar.icon;

          return (
            <Reveal as="li" key={pillar.title} delay={index * 0.06} className="bg-background p-7">
              <Icon aria-hidden="true" className="size-5 text-primary" />
              <h3 className="mt-5 text-[1.0625rem] font-medium">{pillar.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{pillar.description}</p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
