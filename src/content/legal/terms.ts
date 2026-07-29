import { siteConfig } from "@/content/site";
import type { LegalDocument } from "@/content/legal/types";

export const termsAndConditions: LegalDocument = {
  title: "Terms & Conditions",
  summary:
    "The agreement between you and AQVIK: what you can expect from the product, what we expect from you, and where the limits sit.",
  updated: siteConfig.legal.updated,
  sections: [
    {
      id: "agreement",
      heading: "1. Agreement to these terms",
      blocks: [
        {
          type: "paragraph",
          text: "These Terms & Conditions govern your use of the AQVIK Personal OS application, this website and any related services (together, the \"Service\"). By creating an account or using the Service you agree to them. If you do not agree, do not use the Service.",
        },
      ],
    },
    {
      id: "eligibility",
      heading: "2. Eligibility",
      blocks: [
        {
          type: "paragraph",
          text: "You must be at least 18 years old and legally able to enter into a contract. If you use the Service on behalf of an organisation, you confirm you are authorised to bind it to these terms.",
        },
      ],
    },
    {
      id: "account",
      heading: "3. Your account",
      blocks: [
        {
          type: "list",
          items: [
            "Give accurate registration details and keep them current.",
            "Keep your credentials and device secure. You are responsible for activity under your account.",
            "Tell us promptly at " + siteConfig.emails.support + " if you believe your account has been accessed without your permission.",
          ],
        },
      ],
    },
    {
      id: "licence",
      heading: "4. Licence to use the Service",
      blocks: [
        {
          type: "paragraph",
          text: "We grant you a personal, non-exclusive, non-transferable, revocable licence to use the Service for your own financial management. All rights not expressly granted are reserved.",
        },
      ],
    },
    {
      id: "acceptable-use",
      heading: "5. Acceptable use",
      blocks: [
        { type: "paragraph", text: "You agree not to:" },
        {
          type: "list",
          items: [
            "Use the Service for anything unlawful, including money laundering, fraud or tax evasion.",
            "Reverse engineer, decompile or attempt to extract source code, except where that restriction is prohibited by law.",
            "Probe, scan or interfere with the Service, or attempt to access accounts or data that are not yours.",
            "Scrape the Service, or use automated systems to place unreasonable load on it.",
            "Resell, sublicense or provide the Service to third parties as your own.",
            "Upload malware or content that infringes someone else's rights.",
          ],
        },
      ],
    },
    {
      id: "your-data",
      heading: "6. Your content and data",
      blocks: [
        {
          type: "paragraph",
          text: "The records you enter remain yours. You grant us a limited licence to store, process and display that content solely to operate the Service for you — for example to sync it across your devices, generate summaries you request, and back it up.",
        },
        {
          type: "paragraph",
          text: "You are responsible for the accuracy of what you enter. Handling of personal data is described in our Privacy Policy, which forms part of these terms.",
        },
        {
          type: "link",
          href: "/privacy",
          label: "Read the AQVIK Privacy Policy",
        },
      ],
    },
    {
      id: "ai",
      heading: "7. AI features and their limits",
      blocks: [
        {
          type: "paragraph",
          text: "The Service uses artificial intelligence to categorise entries, extract details from receipts, summarise activity and answer questions about your records.",
        },
        {
          type: "list",
          items: [
            "AI output can be incomplete or wrong. Check anything you intend to rely on.",
            "AI suggestions do not become part of your records until you confirm them.",
            "The Service does not initiate payments, transfers or transactions of any kind.",
            "Features that are labelled experimental may change or be withdrawn.",
          ],
        },
      ],
    },
    {
      id: "not-advice",
      heading: "8. Not financial advice",
      blocks: [
        {
          type: "paragraph",
          text: "AQVIK is a record-keeping and analysis tool. It is not a bank, broker, payment service, investment adviser or tax adviser, and it is not registered as any of those.",
        },
        {
          type: "paragraph",
          text: "Nothing in the Service is personalised financial, investment, tax or legal advice. Decisions you make about your money are yours. For advice specific to your circumstances, consult a qualified professional.",
        },
      ],
    },
    {
      id: "pre-release",
      heading: "9. Pre-release status",
      blocks: [
        {
          type: "paragraph",
          text: "The Service is currently in pre-beta. Pre-release software may contain defects, may change substantially, and may be interrupted. Keep your own copies of anything you cannot afford to lose, and use the export tools we provide.",
        },
      ],
    },
    {
      id: "fees",
      heading: "10. Fees and paid features",
      blocks: [
        {
          type: "paragraph",
          text: "The core of the Service is free to use. If we introduce paid features, pricing and terms will be published before any charge applies, and you will be asked to opt in. Where payments are processed through Google Play, that platform's billing and refund terms also apply.",
        },
      ],
    },
    {
      id: "third-party",
      heading: "11. Third-party services",
      blocks: [
        {
          type: "paragraph",
          text: "The Service is distributed through Google Play and relies on third-party infrastructure providers. Their terms govern your relationship with them. We are not responsible for third-party services we do not control.",
        },
      ],
    },
    {
      id: "ip",
      heading: "12. Intellectual property",
      blocks: [
        {
          type: "paragraph",
          text: "The Service, including its software, design, brand and content, is owned by AQVIK and protected by intellectual property laws. You may not use the AQVIK name or marks without written permission.",
        },
      ],
    },
    {
      id: "availability",
      heading: "13. Availability and changes",
      blocks: [
        {
          type: "paragraph",
          text: "We may modify, suspend or discontinue any part of the Service. Where a change materially reduces functionality you rely on, we will give reasonable notice and, where practical, a way to export your data.",
        },
      ],
    },
    {
      id: "termination",
      heading: "14. Termination",
      blocks: [
        {
          type: "paragraph",
          text: "You may stop using the Service and delete your account at any time. We may suspend or terminate access if you breach these terms, if required by law, or if continuing would create a security or legal risk. Sections that by their nature should survive termination will survive it.",
        },
      ],
    },
    {
      id: "warranties",
      heading: "15. Disclaimer of warranties",
      blocks: [
        {
          type: "paragraph",
          text: "The Service is provided \"as is\" and \"as available\". To the maximum extent permitted by law, we disclaim all implied warranties, including merchantability, fitness for a particular purpose and non-infringement. We do not warrant that the Service will be uninterrupted, error-free or that its output will be accurate.",
        },
      ],
    },
    {
      id: "liability",
      heading: "16. Limitation of liability",
      blocks: [
        {
          type: "paragraph",
          text: "To the maximum extent permitted by law, AQVIK will not be liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, lost data or financial losses arising from decisions you make using the Service.",
        },
        {
          type: "paragraph",
          text: "Our total aggregate liability for any claim relating to the Service is limited to the greater of the amount you paid us in the twelve months before the claim, or ₹1,000. Nothing here limits liability that cannot be limited by law.",
        },
      ],
    },
    {
      id: "indemnity",
      heading: "17. Indemnity",
      blocks: [
        {
          type: "paragraph",
          text: "You agree to indemnify AQVIK against claims, damages and reasonable costs arising from your misuse of the Service or your breach of these terms or applicable law.",
        },
      ],
    },
    {
      id: "governing-law",
      heading: "18. Governing law and disputes",
      blocks: [
        {
          type: "paragraph",
          text: `These terms are governed by the laws of ${siteConfig.legal.jurisdiction}, without regard to conflict of law rules. Disputes are subject to the exclusive jurisdiction of the competent courts of India. Before starting proceedings, please write to us — most issues are resolved faster that way.`,
        },
      ],
    },
    {
      id: "changes",
      heading: "19. Changes to these terms",
      blocks: [
        {
          type: "paragraph",
          text: "We may update these terms as the product develops. The date at the top of this page shows the current version, and material changes are notified in the app before they take effect. Continuing to use the Service after that means you accept the updated terms.",
        },
      ],
    },
    {
      id: "contact",
      heading: "20. Contact",
      blocks: [
        {
          type: "paragraph",
          text: `Questions about these terms: ${siteConfig.emails.support}.`,
        },
      ],
    },
  ],
};
