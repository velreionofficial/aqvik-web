import { Section } from "@/components/layout/section";
import { founder } from "@/content/home";
import { siteConfig } from "@/content/site";

export function Founder() {
  return (
    <Section id="founder" title={founder.heading}>
      <div className="glass max-w-2xl space-y-5 rounded-2xl p-6 text-lead text-muted sm:p-8">
        <p>{founder.why}</p>
        <p>
          {founder.reachBefore}
          <a
            href={`mailto:${siteConfig.emails.support}`}
            className="rounded-sm text-primary-soft underline-offset-4 hover:underline"
          >
            {siteConfig.emails.support}
          </a>
          {founder.reachAfter}
        </p>
      </div>
    </Section>
  );
}
