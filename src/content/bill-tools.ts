import type { ToolFaq } from "@/content/tools";

/**
 * Copy for the simple Bill Maker (no GST) and the Quotation Maker. Neither
 * document ever adds tax. The registration question is shown in English and
 * Hinglish so every shopkeeper can pick the right option.
 */

export const billMakerTool = {
  slug: "bill-maker",
  name: "Bill Maker",
  cardLine: "Simple bill or cash memo for shops not registered under GST. PDF or 80 mm receipt.",
  title: "Free Bill Maker — Simple Bill & Cash Memo (No GST) | AQVIK",
  description:
    "Make a simple bill or cash memo for your shop in seconds: items, price per unit, total in words. PDF or thermal receipt. For businesses not registered under GST.",
  h1: "Bill maker",
  intro:
    "Make a clean bill or cash memo for your shop: items, quantity, price per unit and total in words. Download it as a PDF or a receipt-printer strip.",
} as const;

export const quotationTool = {
  slug: "quotation-maker",
  name: "Quotation Maker",
  cardLine: "Send customers a neat quotation or estimate with a valid-until date, as a PDF.",
  title: "Free Quotation Maker — Estimate PDF for Small Business | AQVIK",
  description:
    "Create a professional quotation or estimate with items, rates, discount and a valid-until date, and download it as a PDF. Runs in your browser.",
  h1: "Quotation maker",
  intro:
    "Give your customer a clear price before the work or sale: items, rates, discount and how long the offer is valid. Download it as a PDF.",
} as const;

export const registrationGate = {
  question: "Are you registered under GST?",
  questionHinglish: "Kya aapki dukan ya business GST mein registered hai?",
  options: [
    { value: "no", label: "No, not registered", hinglish: "Nahi, GST registration nahi hai" },
    { value: "regular", label: "Yes, regular GST", hinglish: "Haan, regular GST (GSTIN hai)" },
    { value: "composition", label: "Yes, composition scheme", hinglish: "Haan, composition scheme" },
  ],
  regular:
    "Businesses registered under the regular scheme must issue a Tax Invoice for taxable sales, so a simple bill is not the right document for you.",
  regularHinglish: "Aapko GST wala Tax Invoice banana hoga. Neeche diye GST invoice generator ka use karein.",
  regularLink: "Open the GST invoice generator",
  composition:
    "Composition taxpayers must issue a Bill of Supply, with the words \"composition taxable person, not eligible to collect tax on supplies\" at the top.",
  compositionHinglish: "Aapko Bill of Supply banana hoga. Neeche diye Bill of Supply maker ka use karein.",
  compositionLink: "Open the Bill of Supply maker",
} as const;

export const billCopy = {
  registrationNote:
    "If your turnover crosses the GST registration limit that applies to your state and business, you must register and issue GST documents instead. Check with a tax professional if you are unsure.",
  noTaxNote: "This bill does not add any tax.",
  disclaimer:
    "This tool formats a bill from the details you enter. It does not add or collect any tax. If your business is required to be registered under GST, you must issue GST documents instead. It is not tax or legal advice.",
  quotationDisclaimer:
    "A quotation is an offer, not a bill, and this tool does not add any tax to it. Write how taxes apply in the tax note. It is not tax or legal advice.",
  privacyLine: "Nothing you type leaves your browser.",
  rememberLabel: "Remember my shop details on this device",
  rememberHint: "Saves your shop name, address and phone in this browser only.",
  forget: "Forget saved details",
  cta: "Keep track of your own money too — try AQVIK.",
} as const;

export const billFaqs: readonly ToolFaq[] = [
  {
    question: "Who can use this bill maker?",
    answer:
      "Shops and small businesses that are not registered under GST. Registered businesses must issue GST documents: a Tax Invoice under the regular scheme, or a Bill of Supply under the composition scheme.",
  },
  {
    question: "Can I add GST to this bill?",
    answer:
      "No. A business that is not registered under GST cannot charge GST, so this tool never adds tax. If you are registered, use the GST invoice generator instead.",
  },
  {
    question: "Is my data stored?",
    answer:
      "No. Everything runs in your browser and nothing is sent to a server. Only if you tick \"Remember my shop details on this device\" are your shop name, address and phone kept in this browser, until you choose \"Forget saved details\".",
  },
];

export const quotationFaqs: readonly ToolFaq[] = [
  {
    question: "What is the difference between a quotation and a bill?",
    answer:
      "A quotation is an offer that tells the customer the price before the sale or work. A bill or invoice is issued after the sale and asks for payment.",
  },
  {
    question: "How do I show GST on a quotation?",
    answer:
      "This tool does not calculate tax on quotations. Write how taxes apply in the tax note, for example \"GST extra as applicable\". Once the sale happens, a GST-registered business issues a Tax Invoice.",
  },
  {
    question: "Is my data stored?",
    answer:
      "No. Everything runs in your browser and nothing is sent to a server. Only if you tick \"Remember my shop details on this device\" are your business name, address and phone kept in this browser.",
  },
];
