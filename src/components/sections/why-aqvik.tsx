import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { whyPoints } from "@/content/home";

export function WhyAqvik() {
  return (
    <Section
      id="why"
      label="Position"
      title="Not another expense tracker"
      description="Tracking is the entry point, not the product. The point is a financial operating system: one record, one set of rules, and an assistant that can reason over both."
    >
      <ul className="divide-y divide-hairline border-y border-hairline">
        {whyPoints.map((point, index) => (
          <Reveal as="li" key={point.title} delay={index * 0.05}>
            <div className="grid gap-3 py-8 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-12">
              <h3 className="text-[1.0625rem] font-medium leading-snug">{point.title}</h3>
              <p className="max-w-measure text-[0.9375rem] leading-relaxed text-muted">
                {point.description}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
