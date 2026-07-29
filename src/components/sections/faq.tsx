import { Section } from "@/components/layout/section";
import { FaqAccordion } from "@/components/sections/faq-accordion";

export function Faq() {
  return (
    <Section
      id="faq"
      label="Questions"
      title="Straight answers"
      description="Including the ones where the answer is still 'not yet'."
    >
      <FaqAccordion />
    </Section>
  );
}
