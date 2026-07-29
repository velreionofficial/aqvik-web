import { featureFlags, siteConfig } from "@/content/site";
import type { LegalDocument, LegalSection } from "@/content/legal/types";

const { accountDeletionDays, auditLogDays, crashReportDays, backupRotationDays } =
  siteConfig.retention;

/**
 * The in-app route is gated on `featureFlags.inAppAccountDeletionShipped`.
 * While that flag is false this page documents only the email route, because
 * the Settings → Danger Zone control has not shipped to Google Play and a
 * reviewer following Option 1 would not find it.
 */
const inAppSection: LegalSection = {
  id: "option-in-app",
  heading: "Option 1 — Delete from inside the app",
  blocks: [
    {
      type: "steps",
      items: [
        "Open **AQVIK** and sign in.",
        "Go to **Settings**.",
        "Tap **Delete account**.",
        "Enter your password to confirm. This step exists so that a lost or borrowed phone cannot be used to erase your records.",
        "Confirm. Deletion begins immediately.",
      ],
    },
  ],
};

const emailSection: LegalSection = {
  id: "option-email",
  heading: featureFlags.inAppAccountDeletionShipped
    ? "Option 2 — Request deletion by email"
    : "Request deletion by email",
  blocks: [
    {
      type: "paragraph",
      text: `${
        featureFlags.inAppAccountDeletionShipped ? "If you cannot access the app, email" : "Email"
      } **${siteConfig.emails.support}** from **the address registered to your account**, with the subject **“Delete my account”**.`,
    },
    {
      type: "paragraph",
      text: `We verify the request came from the registered address, then delete the account within **${accountDeletionDays} days**. We confirm by email when it is done.`,
    },
  ],
};

export const deleteAccount: LegalDocument = {
  title: "Delete Your AQVIK Account",
  subtitle: "AQVIK — Personal Finance Operating System",
  updated: siteConfig.legal.updated,
  intro: [
    {
      type: "callout",
      text: "Deleting your account is **permanent**. Your financial records cannot be recovered afterwards, by you or by us. If you only want to remove certain records, see “Deleting individual records” below.",
    },
  ],
  sections: [
    ...(featureFlags.inAppAccountDeletionShipped ? [inAppSection] : []),
    emailSection,
    {
      id: "individual-records",
      heading: "Deleting individual records",
      blocks: [
        {
          type: "paragraph",
          text: "You do not have to delete your whole account to remove data. Inside the app you can delete any of the following individually, at any time:",
        },
        {
          type: "list",
          items: [
            "Transactions — income, expenses, transfers, lending and borrowing records",
            "Accounts, categories and recurring entries",
            "Budgets, goals and investment holdings",
            "Group and shared-expense entries",
            "AI conversations and remembered preferences",
          ],
        },
        {
          type: "paragraph",
          text: "Each deletion is immediate and syncs across every device signed in to your account.",
        },
      ],
    },
    {
      id: "what-is-deleted",
      heading: "What is deleted",
      blocks: [
        {
          type: "table",
          columns: ["Data", "What happens"],
          rows: [
            ["Name, email address, phone number", "Deleted"],
            [
              "All financial records — transactions, accounts, balances, budgets, goals, investments, loans and credit entries",
              "Deleted",
            ],
            ["AI conversations and remembered preferences", "Deleted"],
            ["Registered devices and push notification tokens", "Deleted"],
            ["Sessions and sign-in tokens", "Revoked and deleted"],
            ["Data held on your phone", "Removed when you uninstall the app"],
          ],
        },
      ],
    },
    {
      id: "what-is-kept",
      heading: "What is kept, and for how long",
      blocks: [
        {
          type: "table",
          columns: ["Data", "Retention", "Why"],
          rows: [
            [
              "Security audit records — sign-in times and account actions, with no financial detail",
              `${auditLogDays} days, then deleted`,
              "Fraud and abuse investigation. Required to protect other users.",
            ],
            [
              "Anonymous error and crash reports",
              `${crashReportDays} days, then deleted`,
              "These carry no name, email or financial data and cannot be linked back to you after deletion.",
            ],
            [
              "Encrypted backups",
              `Deleted data ages out within ${backupRotationDays} days`,
              "Backups rotate on a fixed schedule and are not restored selectively.",
            ],
          ],
        },
        {
          type: "note",
          text: "Nothing retained above can be used to reconstruct your financial records or identify you once your account is deleted.",
        },
      ],
    },
    {
      id: "questions",
      heading: "Questions",
      blocks: [
        {
          type: "paragraph",
          text: `Questions about deletion, or anything else: ${siteConfig.emails.support}.`,
        },
        {
          type: "link",
          href: "/privacy",
          label: "Read the AQVIK Privacy Policy",
        },
      ],
    },
  ],
};
