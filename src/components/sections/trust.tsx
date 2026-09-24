import Link from "next/link";

import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { trust } from "@/content/home";

export function Trust() {
  return (
    <Section id="trust" title={trust.heading} description={trust.intro}>
      <ul className="glass divide-y divide-hairline rounded-2xl px-6 sm:px-8">
        {trust.points.map((point, index) => (
          <Reveal as="li" key={point.title} delay={index * 0.04}>
            <div className="grid gap-2 py-7 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:gap-12">
              <h3 className="text-[1.0625rem] font-medium leading-snug">{point.title}</h3>
              <p className="max-w-measure text-[0.9375rem] leading-relaxed text-muted">
                {point.description}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>

      <Link
        href="/privacy"
        className="mt-8 inline-block rounded-sm text-[0.9375rem] text-primary-soft underline-offset-4 hover:underline"
      >
        {trust.link}
      </Link>
    </Section>
  );
}
