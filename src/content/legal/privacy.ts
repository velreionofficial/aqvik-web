import { featureFlags, siteConfig } from "@/content/site";
import type { LegalBlock, LegalDocument } from "@/content/legal/types";

const { accountDeletionDays, auditLogDays, crashReportDays, backupRotationDays } =
  siteConfig.retention;

/**
 * CHANGE 7 — HELD. Published only once the in-app deletion control is live on
 * Google Play. See `featureFlags.inAppAccountDeletionShipped`.
 */
const selfServiceRights: readonly LegalBlock[] = featureFlags.inAppAccountDeletionShipped
  ? [
      {
        type: "paragraph",
        text: "You can act on most of these yourself, without contacting anyone. Export is in Settings under Data. Account deletion is in Settings under Danger Zone.",
      },
    ]
  : [];

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  summary:
    "What AQVIK collects, why it is collected, how long it is kept and what you can do about it. Written to be read, not to be skipped.",
  updated: siteConfig.legal.updated,
  sections: [
    {
      id: "overview",
      heading: "1. Overview",
      blocks: [
        {
          type: "paragraph",
          text: "This policy explains how AQVIK handles personal information in the AQVIK Personal OS mobile application and on this website. AQVIK is operated from India and is currently in pre-beta.",
        },
        {
          type: "paragraph",
          text: "The short version: we collect what the product needs to work, we do not sell your data, and we do not share your financial records with advertisers. Everything below is the detail behind that statement.",
        },
        {
          type: "paragraph",
          text: `Questions about anything here: ${siteConfig.emails.support}`,
        },
      ],
    },
    {
      id: "information-you-provide",
      heading: "2. Information you provide",
      blocks: [
        {
          type: "paragraph",
          text: "You give us information directly when you create an account and when you use the app to record your finances.",
        },
        {
          type: "list",
          items: [
            "Account details: name, email address and an authentication credential.",
            "Financial records you enter: transactions, amounts, categories, accounts, budgets, goals, subscriptions and investment entries.",
            "Content you attach: notes and, if you choose to use receipt capture, receipt images and the text extracted from them.",
            "Messages you send us: support requests, feedback and anything you include in them.",
          ],
        },
        {
          type: "paragraph",
          text: "Financial records you enter are treated as sensitive personal information and are handled accordingly.",
        },
      ],
    },
    {
      id: "authentication",
      heading: "3. Authentication and account security",
      blocks: [
        {
          type: "paragraph",
          text: "Authentication exists to make sure only you can reach your records. We store an identifier for your account and a session token for each signed-in device. Passwords are stored only as a salted one-way hash — we cannot read them.",
        },
        {
          type: "list",
          items: [
            "Sessions are scoped per device and can be revoked from your account.",
            "We record the time and approximate origin of sign-ins so you can spot access you did not authorise.",
            "Repeated failed attempts are rate limited to protect your account.",
          ],
        },
      ],
    },
    {
      id: "automatic",
      heading: "4. Device and diagnostic information",
      blocks: [
        {
          type: "paragraph",
          text: "Some information is collected automatically so the app can run correctly and so we can fix it when it does not.",
        },
        {
          type: "list",
          items: [
            "Device information: model, operating system version, app version, language and region.",
            "A device or installation identifier used to keep your data in sync across your own devices.",
            "Technical logs: request times, error codes and coarse network information.",
          ],
        },
        {
          type: "paragraph",
          text: "We do not collect your precise location, your contacts, or the contents of other apps.",
        },
      ],
    },
    {
      id: "analytics",
      heading: "5. Analytics",
      blocks: [
        {
          type: "paragraph",
          text: "We use product analytics to understand which parts of the app are used and where people get stuck. Analytics events describe actions and screens — for example that a budget was created — not the amounts or descriptions inside your records.",
        },
        {
          type: "list",
          items: [
            "Analytics data is pseudonymous and tied to an installation identifier, not to your financial entries.",
            "It is never used for advertising, and it is not sold or shared for cross-app tracking.",
          ],
        },
      ],
    },
    {
      id: "crash-reporting",
      heading: "6. Crash reporting",
      blocks: [
        {
          type: "paragraph",
          text: "When the app crashes or hits an unexpected error, a report is sent so the fault can be diagnosed. Reports contain the technical stack trace, the app and device version, and the sequence of screens leading to the failure.",
        },
        {
          type: "paragraph",
          text: `Crash reports are configured to exclude the contents of your financial records. They are retained for ${crashReportDays} days and then deleted. If a report unavoidably contains such data, it is removed as soon as the fault is resolved.`,
        },
      ],
    },
    {
      id: "permissions",
      heading: "7. Device permissions",
      blocks: [
        {
          type: "paragraph",
          text: "Every permission is optional, requested only at the moment it is needed, and can be withdrawn at any time in your device settings. The app remains usable without them.",
        },
        {
          type: "list",
          items: [
            "Camera — only to photograph a receipt when you start a receipt capture.",
            "Photos and files — only to attach an image you select, or to save an export you request.",
            "Notifications — only to send reminders and alerts you have turned on.",
          ],
        },
      ],
    },
    {
      id: "ai",
      heading: "8. How AI features process your data",
      blocks: [
        {
          type: "paragraph",
          text: "AQVIK uses AI to categorise entries, summarise activity, extract details from receipts and answer questions about your own records.",
        },
        {
          type: "list",
          items: [
            "AI features run on the minimum data needed to answer the request in front of you.",
            "Your financial records are not used to train third-party foundation models.",
            "AI output is a suggestion. It does not write to your records without your confirmation, and it never moves money.",
          ],
        },
      ],
    },
    {
      id: "use",
      heading: "9. How we use information",
      blocks: [
        {
          type: "list",
          items: [
            "To operate the app: storing, syncing and displaying the records you create.",
            "To secure accounts: authentication, abuse prevention and fraud detection.",
            "To support you: answering the messages you send us.",
            "To improve the product: fixing faults and understanding aggregate usage.",
            "To meet legal obligations where applicable law requires it.",
          ],
        },
        {
          type: "paragraph",
          text: "We do not use your financial records to serve advertising, and we do not build advertising profiles.",
        },
      ],
    },
    {
      id: "sharing",
      heading: "10. Sharing and disclosure",
      blocks: [
        {
          type: "paragraph",
          text: "We do not sell personal information. We share it only in these situations:",
        },
        {
          type: "list",
          items: [
            "Service providers who run infrastructure on our behalf — hosting, database, error reporting, analytics, transactional email and the AI model provider that powers AI features — under contract and only for those purposes.",
            "When you ask us to, for example by using a sharing feature inside the app.",
            "When required by law, valid legal process, or to protect the rights and safety of users.",
            "In connection with a merger or acquisition, in which case you will be notified before your information becomes subject to a different policy.",
          ],
        },
      ],
    },
    {
      id: "retention",
      heading: "11. Data retention",
      blocks: [
        {
          type: "list",
          items: [
            "Your records are kept while your account is active.",
            `If you delete your account, personal data is deleted within ${accountDeletionDays} days, except where law requires us to keep it longer.`,
            `Security audit records — sign-in times and account actions, with no financial detail — are kept for ${auditLogDays} days, then deleted.`,
            `Backups are rotated on a fixed schedule and deleted data ages out of them within ${backupRotationDays} days.`,
            "Aggregate, non-identifying statistics may be retained indefinitely.",
          ],
        },
      ],
    },
    {
      id: "security",
      heading: "12. Security",
      blocks: [
        {
          type: "list",
          items: [
            "Data is encrypted in transit using TLS and encrypted at rest.",
            "Access to production systems is restricted, authenticated and logged.",
            "Amounts are stored as exact integer values, and record history is append-only so changes remain auditable.",
            "Secrets are rotated, and credentials are never shipped inside the mobile app.",
          ],
        },
        {
          type: "paragraph",
          text: "No system is perfectly secure. If a breach affects your personal data, we will notify you and the relevant authority as required by applicable law.",
        },
      ],
    },
    {
      id: "rights",
      heading: "13. Your rights and choices",
      blocks: [
        {
          type: "paragraph",
          text: "Depending on where you live, you may have some or all of the following rights. We honour these requests for all users regardless of location.",
        },
        {
          type: "list",
          items: [
            "Access — ask what personal data we hold about you.",
            "Correction — fix anything inaccurate.",
            "Deletion — delete your account and the records attached to it.",
            "Portability — export your records in a machine-readable format.",
            "Withdraw consent — turn off optional permissions and features at any time.",
            "Object or restrict — ask us to stop specific processing.",
          ],
        },
        ...selfServiceRights,
        {
          type: "paragraph",
          text: `For privacy requests including access, correction, deletion, export of your data or any questions regarding personal information, contact ${siteConfig.emails.support}. We respond within ${accountDeletionDays} days and will ask you to verify ownership of the account first.`,
        },
        {
          type: "link",
          href: "/delete-account",
          label: "How to delete your AQVIK account",
        },
      ],
    },
    {
      id: "children",
      heading: "14. Children",
      blocks: [
        {
          type: "paragraph",
          text: "AQVIK is not directed at children under 18 and we do not knowingly collect their personal information. If you believe a child has created an account, write to support@aqvik.com and we will delete it.",
        },
      ],
    },
    {
      id: "transfers",
      heading: "15. International transfers",
      blocks: [
        {
          type: "paragraph",
          text: "Our infrastructure providers may process data in locations outside your country. Where that happens, transfers are made under appropriate safeguards and the protections in this policy continue to apply.",
        },
      ],
    },
    {
      id: "google-play",
      heading: "16. Google Play compliance",
      blocks: [
        {
          type: "paragraph",
          text: "AQVIK Personal OS is distributed through Google Play and follows its User Data and Financial Services policies.",
        },
        {
          type: "list",
          items: [
            "The Data Safety declaration on our Play Store listing matches this policy.",
            "Data collection and sharing are disclosed before or at the moment of collection.",
            "Sensitive permissions are requested in context and only for the feature that needs them.",
            "Account deletion can be requested in the app and via our website, in line with Google Play's account deletion requirements.",
          ],
        },
        {
          type: "link",
          href: "/delete-account",
          label: "Account deletion instructions",
        },
      ],
    },
    {
      id: "changes",
      heading: "17. Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          text: "When this policy changes we update the date at the top of the page. For material changes we give notice in the app before the change takes effect.",
        },
      ],
    },
    {
      id: "contact",
      heading: "18. Contact",
      blocks: [
        {
          type: "paragraph",
          text: `For privacy requests including access, correction, deletion, export of your data or any questions regarding personal information, contact ${siteConfig.emails.support}. The same address handles support and every other enquiry.`,
        },
        {
          type: "link",
          href: "/terms",
          label: "Read the AQVIK Terms & Conditions",
        },
      ],
    },
  ],
};
