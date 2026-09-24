import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { BetaRequestForm } from "@/components/beta/beta-request-form";
import { joinBeta } from "@/content/home";
import { siteConfig } from "@/content/site";

const whatsappHref = `https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(
  "Hi AQVIK Team,\nI want to become a Beta Tester.",
)}`;

/** Section 8. Every "Join the beta" button on the site scrolls here (#beta). */
export function BetaAccess() {
  return (
    <Section id="beta" title={joinBeta.heading} description={joinBeta.intro}>
      <ol className="grid gap-4 md:grid-cols-3">
        {joinBeta.steps.map((step, index) => (
          <Reveal
            as="li"
            key={step.title}
            delay={index * 0.06}
            className="glass rounded-2xl p-6 sm:p-7"
          >
            <span className="font-mono text-xs text-primary">{index + 1}</span>
            <h3 className="mt-4 text-[1.0625rem] font-medium">{step.title}</h3>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{step.description}</p>
          </Reveal>
        ))}
      </ol>

      <div className="mt-10 max-w-3xl">
        <BetaRequestForm />
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4" />
            {joinBeta.whatsapp}
          </a>
        </Button>
        <a
          href={siteConfig.android.playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-sm text-[0.9375rem] text-primary-soft underline-offset-4 hover:underline sm:ml-3"
        >
          {joinBeta.playStore}
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </a>
      </div>
    </Section>
  );
}
