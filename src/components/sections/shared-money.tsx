import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { sharedMoney } from "@/content/home";

export function SharedMoney() {
  return (
    <Section
      id="shared-money"
      label={sharedMoney.eyebrow}
      title={sharedMoney.heading}
      description={sharedMoney.intro}
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {sharedMoney.steps.map((step, index) => (
          <Reveal
            as="li"
            key={step.title}
            delay={index * 0.06}
            className="glass rounded-2xl p-6 sm:p-7"
          >
            <span className="font-mono text-xs text-primary">{index + 1}</span>
            <h3 className="mt-4 text-[1.125rem] font-medium">{step.title}</h3>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{step.description}</p>
          </Reveal>
        ))}
      </ol>

      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {sharedMoney.cards.map((card, index) => (
          <Reveal as="li" key={card.title} delay={index * 0.06} className="glass rounded-2xl p-6 sm:p-7">
            <h3 className="text-[1.0625rem] font-medium">{card.title}</h3>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{card.description}</p>
          </Reveal>
        ))}
      </ul>

      <p className="mt-8 max-w-measure text-sm leading-relaxed text-muted-dim">
        {sharedMoney.smallPrint}
      </p>
    </Section>
  );
}
