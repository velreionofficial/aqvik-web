import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { features } from "@/content/home";

export function Features() {
  return (
    <Section
      id="features"
      label="Capabilities"
      title="Everything your money touches, in one record"
      description="Each capability writes to the same ledger, which is why the numbers agree with each other no matter which screen you are looking at."
    >
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Reveal
              as="li"
              key={feature.title}
              delay={Math.min(index, 5) * 0.05}
              className="group bg-background transition-colors duration-300 ease-entrance hover:bg-surface"
            >
              <div className="flex h-full flex-col p-7">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-hairline bg-surface text-muted transition-colors duration-300 ease-entrance group-hover:border-primary/40 group-hover:text-primary">
                  <Icon aria-hidden="true" className="size-[1.15rem]" />
                </span>
                <h3 className="mt-6 text-[1.0625rem] font-medium">{feature.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{feature.description}</p>
              </div>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
