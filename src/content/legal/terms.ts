import { siteConfig } from "@/content/site";
import type { LegalDocument, LegalSection } from "@/content/legal/types";

/**
 * Verbatim copy of the in-app Terms & Conditions
 * (apps/mobile/src/features/settings/legalContent.ts @ b7dd852).
 * Do not reword. Change the app first, then copy it here word for word.
 */
const p = (text: string) => ({ type: "paragraph", text }) as const;
const list = (...items: string[]) => ({ type: "list", items }) as const;

const sections: readonly LegalSection[] = [
  {
    id: "agreement",
    heading: "1. Agreement",
    blocks: [
      p(`These Terms govern your use of the AQVIK Personal OS app, the website aqvik.com and related services (the "Service"), operated by AQVIK. By creating an account or using the Service you agree to them. If you do not agree, do not use the Service.`),
    ],
  },
  {
    id: "eligibility",
    heading: "2. Eligibility",
    blocks: [
      p(`You must be at least 18 years old and able to enter into a binding contract under Indian law.`),
    ],
  },
  {
    id: "your-account",
    heading: "3. Your account",
    blocks: [
      list(
        `Give accurate details and keep them current.`,
        `Keep your password and your phone secure. You are responsible for activity under your account.`,
        `Tell us at support@aqvik.com straight away if you think someone else has accessed your account.`,
      ),
    ],
  },
  {
    id: "licence",
    heading: "4. Licence",
    blocks: [
      p(`We give you a personal, non-exclusive, non-transferable, revocable licence to use the Service to manage your own finances. All other rights are reserved.`),
    ],
  },
  {
    id: "what-aqvik-is",
    heading: "5. What AQVIK is — and is not",
    blocks: [
      p(`AQVIK is a record-keeping and analysis tool. It is not a bank, a lender, a payment service, a money-lender, an investment adviser, a tax adviser or a credit bureau, and it is not registered as any of these.`),
      list(
        `AQVIK never holds, moves or collects money. It does not initiate payments or transfers.`,
        `Figures such as interest on a loan agreement, balances, safe-to-spend amounts and forecasts are calculated from what you and others enter. They are information, not advice, and not a guarantee.`,
      ),
    ],
  },
  {
    id: "agreements-between-users",
    heading: "6. Agreements between users",
    blocks: [
      p(`AQVIK lets you record loans and shared expenses with other people. When you do:`),
      list(
        `Any agreement is between you and the other person. AQVIK is not a party to it, does not guarantee it, and does not enforce it.`,
        `You are responsible for making sure any loan, and any interest you agree, is lawful where you and the other person live, including under any state money-lending law that may apply.`,
        `Confirmations recorded in AQVIK show what each person chose to confirm in the app. Whether they have any legal effect is a matter between you and the other person and the applicable law.`,
        `Records shared with another person remain part of their records too, including after you delete your account, as described in our Privacy Policy.`,
      ),
    ],
  },
  {
    id: "other-peoples-information",
    heading: "7. Other people's information",
    blocks: [
      p(`When you enter someone else's name or email — for example to record a loan or invite them to a group — you confirm that you are entitled to do so and that they would reasonably expect it. Do not use invitations to contact people who have not agreed to hear from you.`),
    ],
  },
  {
    id: "acceptable-use",
    heading: "8. Acceptable use",
    blocks: [
      p(`You agree not to:`),
      list(
        `use the Service for anything unlawful, including money laundering, fraud, illegal lending or tax evasion;`,
        `harass, threaten or pressure another user, including over money they owe you;`,
        `reverse engineer or decompile the Service, except where the law allows it;`,
        `probe, scan or disrupt the Service, or try to access accounts or data that are not yours;`,
        `scrape the Service or place unreasonable automated load on it;`,
        `resell or sublicense the Service; or`,
        `upload malware or content that infringes anyone's rights.`,
      ),
    ],
  },
  {
    id: "your-content",
    heading: "9. Your content",
    blocks: [
      p(`The records you enter remain yours. You give us a limited licence to store, process and display them only to run the Service for you — for example to sync your devices, send the notifications you have turned on, and answer your questions to the AI assistant. You are responsible for the accuracy of what you enter.`),
    ],
  },
  {
    id: "ai-assistant",
    heading: "10. AI assistant",
    blocks: [
      list(
        `The assistant can be wrong or incomplete. Check anything you intend to rely on.`,
        `During the beta, the assistant can read and explain your records but cannot create, change or delete them.`,
        `It does not give personalised financial, investment, tax or legal advice.`,
      ),
    ],
  },
  {
    id: "reminders-notifications-statements",
    heading: "11. Reminders, notifications and statements",
    blocks: [
      list(
        `Bill and other reminders are provided on a best-effort basis. They may be late, may not arrive, or may be based on dates you entered incorrectly. You remain responsible for paying your bills, taxes, premiums and dues on time; AQVIK is not responsible for fines, penalties, lapsed cover or other losses from a missed or late payment.`,
        `Notifications may show names and amounts on your lock screen. You can turn them off.`,
        `Monthly statements are generated on your phone from the entries in AQVIK. They are not bank statements and are not issued by any bank or regulated entity.`,
      ),
    ],
  },
  {
    id: "beta",
    heading: "12. Beta",
    blocks: [
      p(`The Service is in closed beta, distributed through Google Play closed testing to people we invite. It may contain defects, change substantially, or be interrupted. Keep your own copies of anything you cannot afford to lose; you can export your records from Settings under Data.`),
    ],
  },
  {
    id: "fees",
    heading: "13. Fees",
    blocks: [
      p(`The Service is currently free. If we introduce paid features, we will publish the price and terms first and you will choose whether to pay. Payments through Google Play are also subject to Google Play's terms.`),
    ],
  },
  {
    id: "third-party-services",
    heading: "14. Third-party services",
    blocks: [
      p(`The Service relies on third parties, including Google Play and our hosting, email, notification and AI providers. We are not responsible for services we do not control.`),
    ],
  },
  {
    id: "intellectual-property",
    heading: "15. Intellectual property",
    blocks: [
      p(`The Service — its software, design, name and content — belongs to AQVIK and is protected by law. You may not use the AQVIK name or logo without written permission.`),
    ],
  },
  {
    id: "changes-to-the-service",
    heading: "16. Changes to the Service",
    blocks: [
      p(`We may change, suspend or stop any part of the Service. If a change materially reduces something you rely on, we will give reasonable notice and, where practical, a way to export your data.`),
    ],
  },
  {
    id: "suspension-and-termination",
    heading: "17. Suspension and termination",
    blocks: [
      p(`You may stop using the Service and delete your account at any time, in the app or by email as described in our Privacy Policy. We may suspend or end your access if you breach these Terms, if the law requires it, or if continuing would create a security or legal risk. Terms that by their nature should survive termination will survive it.`),
    ],
  },
  {
    id: "disclaimer",
    heading: "18. Disclaimer",
    blocks: [
      p(`To the extent the law allows, the Service is provided "as is" and "as available", without warranties of any kind, including that it will be uninterrupted, error-free or that its calculations and reminders will be accurate.`),
    ],
  },
  {
    id: "limitation-of-liability",
    heading: "19. Limitation of liability",
    blocks: [
      p(`To the extent the law allows, AQVIK is not liable for indirect, incidental, special or consequential losses, or for lost profits, lost data, or financial losses from decisions you make, payments you miss, or agreements you enter with other users. Our total liability for any claim is limited to the greater of the amount you paid us in the 12 months before the claim or ₹1,000. Nothing in these Terms limits liability that cannot be limited by law.`),
    ],
  },
  {
    id: "indemnity",
    heading: "20. Indemnity",
    blocks: [
      p(`You agree to compensate AQVIK for claims, losses and reasonable costs arising from your misuse of the Service, your breach of these Terms, or your dealings with other users.`),
    ],
  },
  {
    id: "governing-law",
    heading: "21. Governing law and disputes",
    blocks: [
      p(`These Terms are governed by the laws of India. The courts at India have exclusive jurisdiction. Before starting proceedings, please write to our Grievance Officer — most issues are resolved faster that way.`),
    ],
  },
  {
    id: "changes-to-these-terms",
    heading: "22. Changes to these Terms",
    blocks: [
      p(`We may update these Terms. The date at the top shows the current version, and we notify material changes in the app before they take effect. Continuing to use the Service after that means you accept the updated Terms.`),
    ],
  },
  {
    id: "contact",
    heading: "23. Contact",
    blocks: [
      p(`Questions about these Terms: support@aqvik.com. Grievance Officer: support@aqvik.com.`),
    ],
  },
];

export const termsAndConditions: LegalDocument = {
  title: "AQVIK - Terms & Conditions",
  summary: `The agreement between you and AQVIK - including what AQVIK is not, and how agreements between users work.`,
  updated: siteConfig.legal.updated,
  sections,
};
