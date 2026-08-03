import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { siteConfig } from "@/content/site";

const PREFILLED_MESSAGE = "Hi AQVIK Team,\nI want to become a Beta Tester.";

/**
 * Persistent contact affordance. Rendered once in the root layout so it is
 * present on every route, and kept clear of the iOS home indicator.
 */
export function WhatsAppFloat() {
  const href = `https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(
    PREFILLED_MESSAGE,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message AQVIK on WhatsApp about beta testing"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 inline-flex size-14 items-center justify-center rounded-full border border-hairline-strong bg-surface text-foreground shadow-raised transition-[background-color,border-color,transform] duration-300 ease-entrance hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-raised hover:text-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
