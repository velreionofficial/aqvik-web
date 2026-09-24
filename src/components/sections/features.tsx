import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { everythingElse } from "@/content/home";

export function Features() {
  return (
    <Section id="features" title={everythingElse.heading} description={everythingElse.intro}>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {everythingElse.features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Reveal
              as="li"
              key={feature.title}
              delay={Math.min(index, 3) * 0.05}
              className="glass rounded-2xl p-6 sm:p-7"
            >
              <Icon aria-hidden="true" className="size-5 text-primary" />
              <h3 className="mt-5 text-[1.0625rem] font-medium">{feature.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {feature.description}
              </p>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
