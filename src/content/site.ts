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
    updated: "2026-07-30",
  },
  /**
   * Single source of truth for every retention figure quoted in the legal
   * documents. VERIFY THESE AGAINST ACTUAL INFRASTRUCTURE before launch —
   * they are declarations Google checks against the Data safety form.
   */
  retention: {
    accountDeletionDays: 30,
    auditLogDays: 90,
    crashReportDays: 90,
    backupRotationDays: 90,
  },
} as const;

/**
 * Gates every public statement that depends on the in-app "Delete account"
 * control (Settings → Danger Zone).
 *
 * The control exists in the app codebase but has NOT shipped to Google Play.
 * While this is `false` the website makes no claim that it exists: the
 * delete-account page shows only the email route, and the Privacy Policy omits
 * the self-service sentence in section 13.
 *
 * Flip to `true` ONLY after the Play build containing the control is live.
 * Both documents turn on together, so they cannot disagree.
 */
export const featureFlags: { inAppAccountDeletionShipped: boolean } = {
  inAppAccountDeletionShipped: false,
};

export const primaryNav: readonly NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "Why AQVIK", href: "/#why" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const footerNav: readonly NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Delete Account", href: "/delete-account" },
  { label: "Contact", href: "/contact" },
] as const;
