import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { ScreenshotFrame } from "@/components/shared/screenshot-frame";

/**
 * Reserved slots only. Nothing here invents an interface — when the real
 * captures exist they are passed as children to `ScreenshotFrame` and the
 * layout stays exactly as it is.
 */
const slots = [
  { label: "Dashboard — balances and this month at a glance", caption: "Dashboard" },
  { label: "Spending — categories, filters and history", caption: "Spending" },
  { label: "Assistant — questions answered from your own records", caption: "Assistant" },
] as const;

export function ProductPreview() {
  return (
    <Section
      id="preview"
      label="Product"
      title="Screens are reserved, not imagined"
      description="AQVIK Personal OS is in pre-beta. Rather than mock up an interface that does not ship, these slots are held for the real captures and filled the week the beta opens."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {slots.map((slot, index) => (
          <Reveal key={slot.caption} delay={index * 0.07}>
            <ScreenshotFrame label={slot.label} caption={slot.caption} ratio="phone" />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-6">
        <ScreenshotFrame
          label="Monthly review — the full breakdown with the reasoning shown"
          caption="Monthly review"
          ratio="wide"
        />
      </Reveal>
    </Section>
  );
}
