import { WhatsAppIcon } from "@/components/brand/whatsapp-icon";
import { siteConfig } from "@/content/site";

const PREFILLED_MESSAGE = "Hi AQVIK Team,\nI want to become a Beta Tester.";

/**
 * Persistent WhatsApp button, in WhatsApp green so visitors recognise it at a
 * glance. Rendered once in the root layout so it is on every route, and kept
 * clear of the iOS home indicator.
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
      aria-label="Chat with AQVIK on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_32px_-8px_rgba(37,211,102,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20 transition-transform duration-300 ease-entrance hover:-translate-y-0.5 hover:bg-[#20BD5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 sm:size-[3.75rem]"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
