export type NavItem = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: "AQVIK",
  tagline: "One record for your money, and the money between friends",
  /** Homepage <title>, from the homepage brief. */
  homeTitle: "AQVIK — Shared money, budgets and bills, in one honest record",
  description:
    "AQVIK is a personal finance app for India. Lend and borrow with friends on one shared record you both confirm, split group expenses, get reminded before bills are due, and ask an AI assistant about your own money. Free during beta.",
  /** Footer line, from the homepage brief. */
  footerLine: "AQVIK - One record for your money, and the money between friends.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aqvik.com",
  locale: "en_IN",
  status: "Closed beta",
  emails: {
    support: "support@aqvik.com",
  },
  /**
   * Distribution. The app is in Google Play closed testing: only addresses on
   * the tester list can see the listing or install the build.
   */
  android: {
    packageId: "com.aqvik.personalos",
    /** Play Store listing. Visible only to enrolled testers while in closed testing. */
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.aqvik.personalos",
  },
  /**
   * Public contact number for beta enrolment. Digits only, country code first —
   * this is the format wa.me expects.
   */
  whatsapp: {
    number: "916351082185",
    display: "+91 63510 82185",
  },
  legal: {
    jurisdiction: "India",
    updated: "2026-09-23",
  },
} as const;

export const primaryNav: readonly NavItem[] = [
  { label: "Shared money", href: "/#shared-money" },
  { label: "Features", href: "/#features" },
  { label: "Trust", href: "/#trust" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
] as const;

/** Every "Join the beta" button points here (homepage section 8). */
export const joinBetaHref = "/#beta";

export const footerNav: readonly NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Delete Account", href: "/delete-account" },
  { label: "Contact", href: "/contact" },
] as const;
