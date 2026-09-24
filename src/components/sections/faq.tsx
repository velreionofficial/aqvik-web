import { Plus } from "lucide-react";

import { Section } from "@/components/layout/section";
import { faqHeading, faqs } from "@/content/home";

/**
 * Native <details>/<summary>: every answer is in the server-rendered HTML,
 * so search engines can read them, and it works without JavaScript.
 */
export function Faq() {
  return (
    <Section id="faq" title={faqHeading}>
      <div className="glass divide-y divide-hairline rounded-2xl px-6 sm:px-8">
        {faqs.map((faq) => (
          <details key={faq.question} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-6 text-left text-[1.0625rem] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
              {faq.question}
              <Plus
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-muted-dim transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
              />
            </summary>
            <p className="max-w-measure pb-7 pr-10 text-[0.9375rem] leading-relaxed text-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
