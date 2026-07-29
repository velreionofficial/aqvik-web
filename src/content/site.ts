export type NavItem = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: "AQVIK",
  tagline: "Your AI Personal Finance OS",
  description:
    "AQVIK is an AI personal finance operating system. It organises your money — spending, budgets, goals, subscriptions and investments — and explains what is actually happening to it.",
  shortDescription:
    "An AI personal finance operating system that organises your money and explains what is happening to it.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aqvik.com",
  locale: "en_IN",
  status: "Pre-beta",
  emails: {
    support: "support@aqvik.com",
  },
  legal: {
    jurisdiction: "India",
    updated: "2026-07-01",
  },
} as const;

export const primaryNav: readonly NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "Why AQVIK", href: "/#why" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const footerNav: readonly NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Contact", href: "/contact" },
] as const;
