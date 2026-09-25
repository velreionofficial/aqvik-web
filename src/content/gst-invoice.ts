import type { ToolFaq } from "@/content/tools";

/**
 * Copy for /tools/gst-invoice-generator. The notices below are fixed by the
 * GST invoice brief; keep their wording. Never print "e-invoice", an IRN, an
 * acknowledgement number or a QR code on the generated document.
 */
export const gstInvoiceTool = {
  slug: "gst-invoice-generator",
  name: "GST Invoice Generator",
  cardLine: "Make a GST tax invoice with CGST, SGST or IGST worked out, and download it as PDF or Excel.",
  title: "Free GST Invoice Generator — PDF & Excel | AQVIK",
  description:
    "Create a GST tax invoice with CGST, SGST/UTGST or IGST worked out per line, and download it as PDF or Excel. Runs in your browser.",
  h1: "GST invoice generator",
  intro:
    "Fill in your details and items to create a GST tax invoice, then download it as a PDF or an Excel file. Nothing you type leaves your browser.",
} as const;

export const gstCopy = {
  registeredQuestion: "Are you registered under GST (regular scheme)?",
  registeredYes: "Yes, regular scheme",
  registeredNo: "No, or composition scheme",
  notEligible:
    "Unregistered and composition taxpayers cannot issue a Tax Invoice. They issue a Bill of Supply instead, which this tool does not create yet.",
  invoiceNumberNote:
    "Invoice numbers must be consecutive and unique within a financial year. This tool cannot check your earlier invoices — you are responsible for the series.",
  invoiceNumberSuggestion: "For example INV/2026-27/001",
  hsnHint:
    "Use the number of HSN/SAC digits required for your business's turnover. Check with your accountant if unsure.",
  hsnOptionalHint: "Optional for supplies to unregistered buyers when turnover is up to ₹5 crore.",
  rateNote:
    "GST rates were revised in 2025. Choose the current rate for your item; the tool does not decide it for you.",
  rateHelp:
    "Not sure of the HSN/SAC code or rate? Search the official GST portal. Items that attract compensation cess (such as tobacco and pan masala) are not supported yet.",
  hsnSearchUrl: "https://services.gst.gov.in/services/searchhsnsac",
  turnoverQuestion: "Your business's aggregate turnover in the previous financial year",
  turnoverOptions: [
    { value: "upto5", label: "Up to ₹5 crore" },
    { value: "5to500", label: "₹5 crore to ₹500 crore" },
    { value: "above500", label: "More than ₹500 crore" },
  ],
  turnoverHint:
    "This sets the HSN/SAC digits you must show (4 digits up to ₹5 crore, 6 above) and whether e-invoicing applies.",
  exemptLabel: "My business is exempt from e-invoicing (print the Rule 46(s) declaration)",
  exemptHint:
    "Only a few kinds of business are exempt, for example banks, insurers, goods transport agencies and SEZ units. If you are not sure, check with your tax professional.",
  sezLabel: "This is a supply to an SEZ unit or an export",
  sezBlocked: "Supplies to SEZ units and exports are not supported yet.",
  unregisteredWhy:
    "When the recipient is unregistered and the taxable value is ₹50,000 or more, the invoice must show the recipient's name, delivery address, and state name and code.",
  eInvoiceBanner:
    "E-invoicing: if your business's aggregate annual turnover has exceeded ₹5 crore in any year since 2017-18, B2B invoices must be registered on the GST Invoice Registration Portal (IRP) to get an IRN and QR code. An invoice from this tool does not have an IRN and is not valid for such businesses. Check your obligations before issuing.",
  footerDisclaimer:
    "This tool formats an invoice from the details you enter. You are responsible for the GST rate, HSN/SAC code, place of supply and all other details. It is not tax or legal advice — consult a qualified tax professional for your situation.",
  privacyLine: "Nothing you type leaves your browser.",
  rememberLabel: "Remember my business details on this device",
  rememberHint: "Saves your business names, address, GSTIN, phone and bank details in this browser only.",
  forget: "Forget saved details",
  cta: "Keep track of your own money too — try AQVIK.",
} as const;

export const gstFaqs: readonly ToolFaq[] = [
  {
    question: "Who can issue a tax invoice?",
    answer:
      "A supplier registered under GST in the regular scheme issues a tax invoice for taxable supplies. Unregistered suppliers and composition taxpayers issue a bill of supply instead, which this tool does not create yet.",
  },
  {
    question: "Is this valid for e-invoicing?",
    answer:
      "No. If your business's aggregate annual turnover has exceeded ₹5 crore in any year since 2017-18, B2B invoices must be registered on the Invoice Registration Portal to get an IRN and QR code. This tool does not register invoices, so its invoices are not valid for those businesses.",
  },
  {
    question: "Is my data stored?",
    answer:
      "No. Everything runs in your browser and nothing is sent to a server. Only if you tick \"Remember my business details on this device\" are your business names, address, GSTIN, phone and bank details kept in this browser's local storage, until you choose \"Forget saved details\".",
  },
];
