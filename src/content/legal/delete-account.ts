import { siteConfig } from "@/content/site";
import type { LegalDocument } from "@/content/legal/types";

/**
 * Matches section 12 of the in-app Privacy Policy
 * (apps/mobile/src/features/settings/legalContent.ts @ b7dd852).
 */
export const deleteAccount: LegalDocument = {
  title: "Delete your AQVIK account",
  updated: siteConfig.legal.updated,
  intro: [{ type: "paragraph", text: `You can delete your account in two ways.` }],
  sections: [
    {
      id: "in-the-app",
      heading: "In the app",
      blocks: [
        {
          type: "list",
          items: [
            `Open Settings, go to Danger Zone, and tap Delete account.`,
            `Confirm with your password.`,
            `Deletion happens straight away, in a single operation.`,
          ],
        },
      ],
    },
    {
      id: "by-email",
      heading: "By email",
      blocks: [
        {
          type: "list",
          items: [
            `Write to support@aqvik.com from the email address registered to your account, with the subject "Delete my account".`,
            `We will verify the request comes from the account holder, delete the account within 30 days, and confirm by email.`,
          ],
        },
      ],
    },
    {
      id: "what-is-deleted",
      heading: "What is deleted",
      blocks: [
        {
          type: "list",
          items: [
            `Your profile and account details.`,
            `Your financial records: transactions, accounts, budgets, goals, bills and subscriptions, investments, loans and group expenses.`,
            `Your AI assistant conversations and any memories you approved.`,
            `Your registered devices and notification tokens.`,
            `Error records linked to your account, and your settings.`,
            `The copy of your data on your phone is removed when you uninstall the app.`,
          ],
        },
      ],
    },
    {
      id: "what-is-kept",
      heading: "What is kept, and why",
      blocks: [
        {
          type: "list",
          items: [
            `Records that also belong to someone else. An active loan agreement is part of the other party's financial history, so it is not destroyed when one party deletes their account.`,
            `The audit log. It records actions and ids - for example that an account was deleted, and when - and never the content of your records.`,
            `Backups held by our hosting provider, from which deleted data ages out on the provider's schedule.`,
            `Anything we are required by law to keep.`,
          ],
        },
      ],
    },
  ],
  outro: [
    {
      type: "paragraph",
      text: `Questions: support@aqvik.com. Full details are in our Privacy Policy, section 12.`,
    },
  ],
};
