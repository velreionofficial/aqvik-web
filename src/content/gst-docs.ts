import type { ToolFaq } from "@/content/tools";

/**
 * Copy for the Bill of Supply, Delivery Challan, Credit/Debit Note and Rent
 * Receipt makers. Legal points follow CGST Rules 5(1)(f), 49, 53 and 55 and
 * common HRA practice; nothing here promises that a document is compliant
 * for every case.
 */

export const billOfSupplyTool = {
  slug: "bill-of-supply",
  name: "Bill of Supply Maker",
  cardLine: "For composition dealers and exempt supplies. No tax, with the declaration printed on top.",
  title: "Free Bill of Supply Format & Maker — Composition Dealers | AQVIK",
  description:
    "Make a GST Bill of Supply in seconds: composition declaration at the top, GSTIN, HSN, items and total in words. Download as PDF. Runs in your browser.",
  h1: "Bill of Supply maker",
  intro:
    "Composition taxpayers and businesses supplying exempt goods or services issue a Bill of Supply instead of a tax invoice. Fill in the details and download a clean PDF.",
} as const;

export const deliveryChallanTool = {
  slug: "delivery-challan",
  name: "Delivery Challan Maker",
  cardLine: "Move goods for job work or other reasons with a proper challan in three copies.",
  title: "Free Delivery Challan Format & Maker (GST) | AQVIK",
  description:
    "Create a GST delivery challan for job work, goods not for sale, or supply where the invoice follows. HSN, value, tax where needed, and the three copies. PDF.",
  h1: "Delivery challan maker",
  intro:
    "When goods move without a tax invoice, for job work, for a reason other than sale, or when the invoice follows, send them with a delivery challan. Make one here as a PDF.",
} as const;

export const noteTool = {
  slug: "credit-debit-note",
  name: "Credit & Debit Note Maker",
  cardLine: "Returns, discounts or price corrections against an earlier GST invoice.",
  title: "Free GST Credit Note & Debit Note Maker | AQVIK",
  description:
    "Make a GST credit note or debit note against an earlier invoice: original invoice number and date, reason, taxable value and CGST/SGST or IGST. Download as PDF.",
  h1: "Credit note and debit note maker",
  intro:
    "Issue a credit note when goods come back or the invoice charged too much, and a debit note when it charged too little. Link it to the original invoice and download a PDF.",
} as const;

export const rentReceiptTool = {
  slug: "rent-receipt",
  name: "Rent Receipt Generator",
  cardLine: "Monthly rent receipts for HRA, with landlord PAN and revenue-stamp space when needed.",
  title: "Free Rent Receipt Generator for HRA (PDF) | AQVIK",
  description:
    "Generate monthly rent receipts for the whole year in one PDF: tenant, landlord, PAN, property address and payment mode. Revenue-stamp box for cash above ₹5,000.",
  h1: "Rent receipt generator",
  intro:
    "Make one receipt for every month you paid rent, ready for your landlord to sign and for you to submit for HRA. Three receipts fit on each A4 page.",
} as const;

export const bosCopy = {
  question: "Why do you issue a Bill of Supply?",
  questionHinglish: "Aap Bill of Supply kyon bana rahe hain?",
  options: [
    { value: "composition", label: "I am in the composition scheme", hinglish: "Main composition scheme mein hoon" },
    { value: "exempt", label: "Regular GST, but these items are exempt", hinglish: "Regular GST hai, par ye saaman/service exempt hai" },
    { value: "none", label: "I am not registered under GST", hinglish: "Mera GST registration nahi hai" },
  ],
  notRegistered:
    "A Bill of Supply is issued by businesses registered under GST. If you are not registered, make a simple bill instead.",
  notRegisteredHinglish: "GST registration nahi hai to simple bill banaiye.",
  exemptNote:
    "Use this only for goods or services exempt from GST. Taxable supplies need a tax invoice; use the GST invoice generator for those.",
  disclaimer:
    "This tool formats a Bill of Supply from the details you enter, following CGST Rule 49. It adds no tax. Check your own situation with a tax professional; this is not tax or legal advice.",
  cta: "Track your own money too — try AQVIK.",
} as const;

export const challanCopy = {
  purposeHinglish: {
    "job-work": "Job work ke liye maal bhej rahe hain",
    "not-supply": "Bikri nahi hai, jaise apne godown mein maal bhejna",
    "liquid-gas": "Liquid gas, jiski quantity nikalte waqt pata nahi",
    "invoice-later": "Maal bech rahe hain, invoice delivery ke baad banega",
    "notified": "CBIC ne jo aur supply notify ki hai",
  } as Record<string, string>,
  taxShown: "This movement is for supply, so the challan shows the GST rate and tax amount.",
  taxHidden: "This movement is not a supply, so the challan shows the value of goods without tax.",
  copyHint: "Make three copies: original for the consignee, duplicate for the transporter, triplicate for you.",
  eWayNote:
    "Goods moving on a challan may also need an e-way bill under the e-way bill rules. Generate it on the e-way bill portal; this tool does not create one.",
  disclaimer:
    "This tool formats a delivery challan from the details you enter, following CGST Rule 55. It does not generate an e-way bill. It is not tax or legal advice.",
  cta: "Track your own money too — try AQVIK.",
} as const;

export const noteCopy = {
  types: [
    { value: "credit" as const, label: "Credit note", hinglish: "Buyer ka paisa kam karna hai (return, zyada charge)" },
    { value: "debit" as const, label: "Debit note", hinglish: "Buyer se aur paisa lena hai (kam charge hua tha)" },
  ],
  whoCanIssue:
    "Issued by the GST-registered supplier who made the original tax invoice. Keep the same place of supply and GST rates as that invoice.",
  timeLimit:
    "A credit note reduces your GST only if declared by 30 November after the end of the financial year of the supply, or by the date you file that year's annual return if earlier. For a registered buyer, your tax is reduced only if the buyer reverses the matching input tax credit.",
  debitTiming: "Declare the debit note in your GST return for the month in which you issue it.",
  lateWarning:
    "This credit note is dated after that deadline, so it cannot reduce your GST. You can still settle the amount with a plain commercial credit note without GST. Check with your tax professional.",
  multipleHint: "One note can cover several invoices to the same buyer. Add each invoice number and date.",
  reverseChargeHint: "Tax is shown on the note but not added to the total, because the buyer pays it.",
  itemsHint:
    "Enter only the difference. For a return, the returned quantity at the original rate. For a price change, quantity 1 and the difference in value as the amount. Use the same GST rate as the original invoice.",
  disclaimer:
    "This tool formats a credit or debit note from the details you enter, following CGST Rule 53. It does not file anything or report it to the e-invoice portal. It is not tax or legal advice.",
  cta: "Track your own money too — try AQVIK.",
} as const;

export const rentCopy = {
  panWarning:
    "Your rent for a year is above ₹1,00,000, so your employer will usually ask for the landlord's PAN. If the landlord has no PAN, get a signed declaration from them.",
  panWarningHinglish: "Saal ka kiraya ₹1 lakh se zyada hai, isliye landlord ka PAN chahiye hoga.",
  stampNote:
    "Cash payments above ₹5,000 need a ₹1 revenue stamp on the receipt, signed across by the landlord. The PDF leaves a box for it.",
  stampNoteHinglish: "Cash mein ₹5,000 se zyada diya hai to receipt par ₹1 ka revenue stamp lagakar landlord sign kare.",
  hraNote:
    "HRA exemption is available only under the old tax regime. Your employer may ask for the rent agreement too.",
  disclaimer:
    "This tool prints receipts from the details you enter. Receipts must match rent actually paid and must be signed by the landlord. It is not tax advice.",
  cta: "Plan the rest of your money with AQVIK.",
} as const;

export const bosFaqs: readonly ToolFaq[] = [
  {
    question: "Who issues a Bill of Supply?",
    answer: "A GST-registered business in the composition scheme, or a registered business supplying goods or services that are exempt from GST. It is issued instead of a tax invoice and shows no tax.",
  },
  {
    question: "What must a composition dealer print on it?",
    answer: "The words \"composition taxable person, not eligible to collect tax on supplies\" at the top of the bill. This tool adds them when you choose the composition option.",
  },
  {
    question: "What details does a Bill of Supply need?",
    answer: "Your name, address and GSTIN, a serial number of up to 16 characters, the date, the recipient's name, address and GSTIN if registered, HSN or SAC codes, a description, the value after discount, and a signature.",
  },
];

export const challanFaqs: readonly ToolFaq[] = [
  {
    question: "When is a delivery challan used instead of an invoice?",
    answer: "When goods are sent for job work, moved for a reason other than a supply, when liquid gas is sent without knowing the exact quantity, or when the goods are for supply but the tax invoice could not be issued at the time of removal.",
  },
  {
    question: "Why three copies?",
    answer: "For a supply of goods, the challan is made in triplicate: original for the consignee, duplicate for the transporter and triplicate for the consigner. Choose the copy before downloading each one.",
  },
  {
    question: "Does the challan show GST?",
    answer: "It shows the GST rate and tax amount only when the goods are moving for supply to the consignee. For job work or other non-supply movement it shows the value of the goods.",
  },
];

export const noteFaqs: readonly ToolFaq[] = [
  {
    question: "When do I issue a credit note?",
    answer: "When the invoice charged more value or tax than payable, when the buyer returns goods, or when services are found deficient. It reduces the amount the buyer owes.",
  },
  {
    question: "When do I issue a debit note?",
    answer: "When the invoice charged less value or tax than payable. It increases the amount the buyer owes.",
  },
  {
    question: "What must a credit or debit note mention?",
    answer: "That it is a credit or debit note, your and the recipient's details, its own number and date, the number and date of the original invoice, and the value, rate and tax being credited or debited, with a signature.",
  },
];

export const rentFaqs: readonly ToolFaq[] = [
  {
    question: "When is the landlord's PAN needed?",
    answer: "Employers usually ask for it when the rent paid in the year is more than ₹1,00,000. If the landlord has no PAN, a signed declaration from the landlord is commonly accepted.",
  },
  {
    question: "Do rent receipts need a revenue stamp?",
    answer: "A receipt for a cash payment above ₹5,000 needs a ₹1 revenue stamp signed across by the landlord. Payments by bank transfer, UPI or cheque do not need one.",
  },
  {
    question: "Can I use these receipts under the new tax regime?",
    answer: "HRA exemption is available only under the old tax regime. Under the new regime your employer will not exempt HRA, whatever receipts you submit.",
  },
];
