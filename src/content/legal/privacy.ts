import type { LegalDocument } from "@/content/legal/types";

/**
 * Verbatim copy of the in-app Privacy Policy
 * (apps/mobile/src/features/settings/legalContent.ts @ b7dd852).
 * Do not reword. Change the app first, then copy it here word for word.
 */
export const privacyPolicy: LegalDocument = {
  title: "AQVIK - Privacy Policy",
  summary: "What AQVIK collects, why, who sees it, how long it is kept, and your rights.",
  /** Privacy only; Terms and Delete Account keep siteConfig.legal.updated. */
  updated: "2026-09-25",
  sections: [
    {
      id: "who-we-are",
      heading: "1. Who we are",
      blocks: [
        {
          type: "paragraph",
          text: `AQVIK Personal OS ("AQVIK", "we", "us") is a personal finance application operated from India by its founder (the "Data Fiduciary" under the Digital Personal Data Protection Act, 2023). This policy covers the AQVIK mobile app and the website aqvik.com.`,
        },
        {
          type: "paragraph",
          text: `AQVIK is in closed beta. The short version: we collect what the app needs to work, we do not sell your data, we show no advertising, and we do not use your financial records to train AI models.`,
        },
      ],
    },
    {
      id: "information-you-give-us",
      heading: "2. Information you give us",
      blocks: [
        { type: "subheading", text: "Your account" },
        {
          type: "list",
          items: [
            `Name, email address and password. Passwords are stored only as a bcrypt hash; we cannot read them.`,
            `Mobile number — optional. You add it in your profile; it is not used to sign in and is not verified.`,
            `Preferred language, currency and time zone.`,
            `Country — set to India for every account today; we do not ask for it.`,
          ],
        },
        { type: "subheading", text: "Your financial records" },
        {
          type: "list",
          items: [
            `Transactions, accounts, categories, budgets and goals.`,
            `Bills and subscriptions, including due dates and amounts (for example rent, insurance premiums, vehicle tax or PUC).`,
            `Investments, loans you give or take, and group expenses you split.`,
            `Notes you write on any of these.`,
          ],
        },
        {
          type: "paragraph",
          text: `We treat your financial records as sensitive personal data.`,
        },
        { type: "subheading", text: "Information about other people" },
        {
          type: "paragraph",
          text: `When you record money you lend, borrow or split, you may enter the name of another person, and when you invite someone to a loan agreement or a group you enter their email address. We use this only to provide the feature you asked for. Please only enter details of people who would expect you to — see our Terms.`,
        },
        { type: "subheading", text: "Your conversations with the AI assistant" },
        {
          type: "paragraph",
          text: `Messages you send to the assistant and its replies are stored in your account so you can see your conversation history. AQVIK may offer to remember a preference or fact about you; it is saved only if you approve it, and you can view or delete saved memories in the app.`,
        },
      ],
    },
    {
      id: "information-from-our-website",
      heading: "3. Information from our website",
      blocks: [
        {
          type: "paragraph",
          text: `aqvik.com has no account area and uses no advertising or tracking cookies. It collects personal information only when you choose to send it:`,
        },
        {
          type: "list",
          items: [
            `Beta tester request: the details you enter on the form, such as your name and email, used only to add you to the closed test on Google Play and to contact you about it.`,
            `Messages you send to support@aqvik.com or through the contact page.`,
            `If you use the WhatsApp link, your conversation happens on WhatsApp and is governed by WhatsApp's privacy policy; we see your number and what you write.`,
          ],
        },
        {
          type: "paragraph",
          text: `The website is hosted on Vercel. We use Vercel Web Analytics to count page visits in aggregate - which pages are visited, the referring site, and the visitor's country, device type and browser. It does not use cookies, does not identify you, and nothing you type into our tools is sent.`,
        },
      ],
    },
    {
      id: "information-collected-automatically",
      heading: "4. Information collected automatically",
      blocks: [
        {
          type: "list",
          items: [
            `Device details: device name or model, platform (Android or iOS) and app version.`,
            `An installation identifier, created when the app is installed, used to keep your data in sync across your own devices.`,
            `A push-notification token, used only to deliver notifications to that device.`,
            `Our hosting provider's standard request logs, which may include IP address and timing, kept for a short period for security and fault-finding.`,
          ],
        },
        { type: "subheading", text: "What we do not collect" },
        {
          type: "list",
          items: [
            `We do not read your SMS, your contacts, your precise location, your camera, your microphone, or other apps.`,
            `We do not currently use any third-party analytics or crash-reporting service in the app. The website uses Vercel Web Analytics, as described in section 3. If we add any other service, we will update this policy before it goes live.`,
          ],
        },
        { type: "subheading", text: "Error records" },
        {
          type: "paragraph",
          text: `When something fails on our servers, we record the error: what failed, where, when, the app version and platform, and the id of the account involved, so it can be investigated. These records are deleted when you delete your account.`,
        },
      ],
    },
    {
      id: "features-that-involve-other-people",
      heading: "5. Features that involve other people",
      blocks: [
        {
          type: "paragraph",
          text: `Some features exist to share a record between two or more people. When you use them, the other people involved can see the parts of your information that the feature needs.`,
        },
        {
          type: "list",
          items: [
            `Loan agreements: the other party sees your name, the amount, the terms, the repayment history and the status of the agreement.`,
            `Shared ledger: both parties see every entry either of them writes, confirms or disputes on that agreement.`,
            `Groups and splits: members of a group see its name, its members, and the expenses and settlements recorded in it.`,
            `Invitations: when you invite someone by email, we never tell you whether that email belongs to an AQVIK account. If it does, that person is notified of the invitation with your name and the group or agreement name.`,
          ],
        },
        {
          type: "paragraph",
          text: `Anything shared this way is also part of the other person's records. See section 12 for what that means when an account is deleted.`,
        },
      ],
    },
    {
      id: "notifications",
      heading: "6. Notifications",
      blocks: [
        {
          type: "paragraph",
          text: `If you allow notifications, AQVIK sends reminders and alerts — for example a bill coming due, a loan proposal, or a shared-ledger entry awaiting your confirmation. Notifications are delivered through Expo's push service and Google Firebase Cloud Messaging.`,
        },
        {
          type: "paragraph",
          text: `Notifications can include a person's name and an amount of money. They may appear on your lock screen, where anyone holding your phone can read them. You can turn notifications off in the app or in your device settings.`,
        },
      ],
    },
    {
      id: "device-permissions",
      heading: "7. Device permissions",
      blocks: [
        {
          type: "paragraph",
          text: `The app asks for one permission: notifications, and only if you choose to allow them. It does not use the camera, microphone, contacts, location or SMS.`,
        },
        {
          type: "paragraph",
          text: `Some older versions of Android may also list a storage permission that the app does not use.`,
        },
      ],
    },
    {
      id: "data-on-your-device-and-exports",
      heading: "8. Data on your device and exports",
      blocks: [
        {
          type: "paragraph",
          text: `AQVIK works offline. A copy of your records is stored on your phone in the app's private storage and synchronised with our servers when you are online. This copy is not separately encrypted by AQVIK, so protecting your phone with a screen lock matters.`,
        },
        {
          type: "paragraph",
          text: `Monthly statements (CSV and PDF) are created entirely on your phone. We never receive them. When you share one, it goes only where you choose to send it.`,
        },
        {
          type: "paragraph",
          text: `"Share AQVIK with a friend" opens your phone's share sheet with a message and an install link. We do not learn who you share it with.`,
        },
      ],
    },
    {
      id: "how-ai-features-use-your-data",
      heading: "9. How AI features use your data",
      blocks: [
        {
          type: "paragraph",
          text: `The AI assistant answers questions about your own records. To do that, the relevant part of your question and records is sent to our AI model provider, a third-party AI model provider, which processes it to produce a reply.`,
        },
        {
          type: "list",
          items: [
            `Only the data needed to answer the question in front of it is sent.`,
            `Your records are not used by us, or by our provider under our agreement, to train AI models.`,
            `During the beta, the assistant cannot create, change or delete your financial records. It can only read and explain them.`,
            `AI replies can be wrong. They are information, not financial advice.`,
          ],
        },
      ],
    },
    {
      id: "why-we-use-your-information",
      heading: "10. Why we use your information",
      blocks: [
        {
          type: "list",
          items: [
            `To provide the app: store, sync and show your records, and run the features you use.`,
            `To keep accounts secure: authentication, rate limiting and abuse prevention.`,
            `To send the notifications you have turned on.`,
            `To answer you when you contact us.`,
            `To fix faults and understand, in aggregate, how the app is used.`,
            `To comply with the law.`,
          ],
        },
        {
          type: "paragraph",
          text: `We process your personal data on the basis of your consent, given when you create an account and when you turn on optional features, and for the legitimate uses permitted by the Digital Personal Data Protection Act, 2023. We do not use your data for advertising and we do not sell it.`,
        },
      ],
    },
    {
      id: "who-we-share-it-with",
      heading: "11. Who we share it with",
      blocks: [
        {
          type: "paragraph",
          text: `We share personal data only with service providers that run parts of AQVIK for us, under contract, and only for that purpose. Today these are:`,
        },
        {
          type: "list",
          items: [
            `Railway — application hosting and database.`,
            `Vercel — website hosting and aggregate website analytics.`,
            `Brevo — transactional email (for example sign-up and password emails).`,
            `Expo and Google (Firebase Cloud Messaging) — delivery of push notifications.`,
            `our AI model provider — processing AI assistant requests.`,
            `Google Play — app distribution and, if we introduce paid features, billing.`,
          ],
        },
        {
          type: "paragraph",
          text: `We may also disclose information to the other people involved in a shared feature you use (section 5), when required by law or a valid legal order, or to protect the safety of users. If AQVIK is merged or acquired, we will tell you before your data becomes subject to a different policy.`,
        },
      ],
    },
    {
      id: "retention-and-deletion",
      heading: "12. How long we keep it, and deletion",
      blocks: [
        {
          type: "paragraph",
          text: `We keep your data while your account is active.`,
        },
        {
          type: "paragraph",
          text: `You can delete your account in two ways. In the app: Settings under Danger Zone, then Delete account, confirmed with your password - deletion happens straight away, in a single operation. By email: write to support@aqvik.com from your registered address with the subject "Delete my account"; we verify it and delete within 30 days, and confirm by email.`,
        },
        {
          type: "paragraph",
          text: `Deletion removes your profile, financial records, AI conversations and saved memories, devices and notification tokens, error records linked to you, and your settings. The copy of your data on your phone is removed when you uninstall the app. There are three exceptions:`,
        },
        {
          type: "list",
          items: [
            `Records that also belong to someone else. An active loan agreement is part of the other party's financial history, so it is not destroyed when one party deletes their account.`,
            `The audit log. It records actions and ids - for example that an account was deleted, and when - and never the content of your records. It is currently kept without a fixed end date so the history of actions on the system stays intact.`,
            `Backups held by our hosting provider, from which deleted data ages out on the provider's schedule.`,
          ],
        },
        {
          type: "paragraph",
          text: `We may also keep information where a law requires us to.`,
        },
      ],
    },
    {
      id: "security",
      heading: "13. Security",
      blocks: [
        {
          type: "list",
          items: [
            `Data is encrypted in transit using TLS.`,
            `Data stored on our servers is protected by our hosting provider's encryption and access controls.`,
            `Passwords are hashed; each device is registered to your account and can be removed from Settings.`,
            `Repeated failed sign-in attempts are rate limited.`,
            `Money is stored as exact whole numbers of paise, and financial history is append-only so changes stay auditable.`,
          ],
        },
        {
          type: "paragraph",
          text: `No system is perfectly secure. If a personal data breach occurs, we will inform affected users and the Data Protection Board of India as the law requires.`,
        },
      ],
    },
    {
      id: "your-rights",
      heading: "14. Your rights",
      blocks: [
        {
          type: "paragraph",
          text: `Under the Digital Personal Data Protection Act, 2023 you have the right to:`,
        },
        {
          type: "list",
          items: [
            `get a summary of the personal data we hold about you and how it is used;`,
            `have inaccurate or incomplete data corrected and updated;`,
            `have your data erased, subject to section 12;`,
            `withdraw consent — for example by turning off notifications or deleting your account;`,
            `nominate another person to exercise your rights if you die or become incapable;`,
            `have your grievances addressed by us, and then, if unresolved, to complain to the Data Protection Board of India.`,
          ],
        },
        {
          type: "paragraph",
          text: `You can also export your records yourself from Settings under Data. To exercise any right, write to support@aqvik.com. We will ask you to confirm the request comes from the account holder and will respond within 30 days.`,
        },
      ],
    },
    {
      id: "children",
      heading: "15. Children",
      blocks: [
        {
          type: "paragraph",
          text: `AQVIK is only for people aged 18 or over. We do not knowingly process the personal data of children. If you believe a child has created an account, write to support@aqvik.com and we will delete it.`,
        },
      ],
    },
    {
      id: "where-your-data-is-processed",
      heading: "16. Where your data is processed",
      blocks: [
        {
          type: "paragraph",
          text: `Our service providers may store or process data outside India, including in the regions where our hosting provider operates. We only transfer data to countries that are not restricted by the Government of India under the Digital Personal Data Protection Act, 2023.`,
        },
      ],
    },
    {
      id: "google-play",
      heading: "17. Google Play",
      blocks: [
        {
          type: "paragraph",
          text: `AQVIK is distributed through Google Play and follows its User Data and Financial Services policies. Our Play Store Data Safety declaration matches this policy, and account deletion is available both in the app and on our website.`,
        },
      ],
    },
    {
      id: "changes",
      heading: "18. Changes to this policy",
      blocks: [
        {
          type: "paragraph",
          text: `When we change this policy we update the date at the top. For material changes we tell you in the app before they take effect.`,
        },
      ],
    },
    {
      id: "contact",
      heading: "19. Contact and grievance officer",
      blocks: [
        {
          type: "paragraph",
          text: `Grievance Officer: the AQVIK founder. Email: support@aqvik.com.`,
        },
        {
          type: "paragraph",
          text: `We acknowledge grievances promptly and aim to resolve them within 30 days.`,
        },
      ],
    },
  ],
};
