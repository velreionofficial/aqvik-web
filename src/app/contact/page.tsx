import { ArrowUpRight, LifeBuoy, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { createMetadata } from "@/lib/seo";
import { siteConfig } from "@/content/site";

export const metadata = createMetadata({
  title: "Contact",
  description:
    "Reach the AQVIK team. Support and product questions, privacy and data requests, and beta access.",
  path: "/contact",
});

const channels = [
  {
    icon: LifeBuoy,
    label: "Support and product",
    email: siteConfig.emails.support,
    description:
      "Questions about the app, bug reports, feedback, beta access and anything about the roadmap.",
  },
  {
    icon: ShieldCheck,
    label: "Privacy and data",
    email: siteConfig.emails.support,
    description:
      "Access, correction, export or deletion requests, and any question about how your data is handled. These reach the same inbox.",
  },
] as const;

const helpful = [
  "The device and app version, if you are reporting something broken.",
  "What you expected to happen, and what happened instead.",
  "For data requests, the email address on the account so we can verify it is yours.",
] as const;

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-hairline">
        <Container>
          <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="hidden pt-24 lg:block lg:border-r lg:border-hairline lg:pr-10">
              <p className="eyebrow">Contact</p>
            </div>
            <div className="relative pb-16 pt-16 lg:pb-20 lg:pl-14 lg:pt-24">
              <span aria-hidden="true" className="rail-node hidden lg:block" />
              <h1 className="max-w-[16ch] text-display-lg">Talk to the people building it</h1>
              <p className="mt-6 max-w-measure text-lead text-muted">
                AQVIK is a small team. Email reaches us directly — there is no ticket queue and no
                contact form pretending to be one. We aim to reply within two working days.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <div className="grid lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="hidden pt-16 lg:block lg:border-r lg:border-hairline lg:pr-10" />

          <div className="pb-24 pt-12 lg:pl-14 lg:pt-16">
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2">
              {channels.map((channel, index) => {
                const Icon = channel.icon;

                return (
                  <Reveal as="li" key={channel.label} delay={index * 0.06} className="bg-background">
                    <a
                      href={`mailto:${channel.email}`}
                      className="group flex h-full flex-col p-7 transition-colors duration-300 ease-entrance hover:bg-surface"
                    >
                      <Icon aria-hidden="true" className="size-5 text-primary" />
                      <h2 className="mt-5 text-[1.0625rem] font-medium">{channel.label}</h2>
                      <p className="mt-2.5 text-sm leading-relaxed text-muted">
                        {channel.description}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-1.5 font-mono text-sm text-primary-soft">
                        {channel.email}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-3.5 transition-transform duration-300 ease-entrance group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      </span>
                    </a>
                  </Reveal>
                );
              })}
            </ul>

            <div className="mt-16 border-t border-hairline pt-10">
              <h2 className="eyebrow">What helps us answer faster</h2>
              <ul className="mt-6 max-w-prose space-y-3 border-l border-hairline pl-6">
                {helpful.map((item) => (
                  <li key={item} className="text-[0.9375rem] leading-relaxed text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-16 border-t border-hairline pt-10">
              <h2 className="eyebrow">Beta access</h2>
              <p className="mt-6 max-w-measure text-[0.9375rem] leading-relaxed text-muted">
                AQVIK Personal OS is in closed testing on Google Play, which is invite-only. Write
                to{" "}
                <a
                  href={`mailto:${siteConfig.emails.support}`}
                  className="rounded-sm text-foreground underline underline-offset-4 hover:text-primary-soft"
                >
                  {siteConfig.emails.support}
                </a>{" "}
                with the email address on your Google account and we will add you to the tester
                list. You can also send your details over WhatsApp from the homepage.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
