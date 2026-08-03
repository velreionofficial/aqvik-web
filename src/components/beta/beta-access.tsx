import { ArrowUpRight, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { BetaTesterDialog } from "@/components/beta/beta-tester-dialog";
import { siteConfig } from "@/content/site";

const steps: readonly { title: string; detail: string }[] = [
  {
    title: "Open the Google Play link",
    detail:
      "Use the button above, signed in to the Google account you gave us. Closed testing is invite-only, so the listing stays hidden until your address is on the list.",
  },
  {
    title: "Join the testing programme",
    detail:
      "Accept the invitation on the page that opens. This is what unlocks the build for your account.",
  },
  {
    title: "Install or update AQVIK",
    detail:
      "Install from Google Play as normal. Later beta builds arrive as ordinary app updates.",
  },
];

export function BetaAccess() {
  return (
    <Section
      id="beta"
      label="Access"
      title="AQVIK is in closed beta"
      description="The Android build is live on Google Play closed testing. It carries the newest features, bug fixes and performance improvements — and, being a beta, the rough edges that come with them."
    >
      <Reveal>
        <div className="rounded-2xl border border-hairline bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <a href={siteConfig.android.playStoreUrl} target="_blank" rel="noopener noreferrer">
                <Download aria-hidden="true" className="size-4" />
                Join the closed beta
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </a>
            </Button>
            <Badge variant="accent">Beta</Badge>
          </div>

          <p className="mt-5 max-w-measure text-sm leading-relaxed text-muted-dim">
            Already on the tester list? The link takes you straight to the listing. If it shows
            nothing, your Google account has not been added yet — request access below.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.06} className="mt-10">
        <h3 className="eyebrow">Not enrolled yet? Three steps</h3>
        <ol className="mt-6 divide-y divide-hairline border-y border-hairline">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-6">
              <span className="font-mono text-xs leading-6 text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-[1.0625rem] font-medium text-foreground">
                  {step.title}
                </span>
                <span className="mt-2 block max-w-measure text-sm leading-relaxed text-muted">
                  {step.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal delay={0.12} className="mt-10 max-w-xl">
        <BetaTesterDialog />
      </Reveal>
    </Section>
  );
}
