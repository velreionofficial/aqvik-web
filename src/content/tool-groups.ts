import { billMakerTool, quotationTool } from "@/content/bill-tools";
import { billOfSupplyTool, deliveryChallanTool, noteTool, rentReceiptTool } from "@/content/gst-docs";
import { gstInvoiceTool } from "@/content/gst-invoice";
import { creditCardTool, emiTool, fdTool, gstCalcTool, prepaymentTool, rdTool, sipTool, swpTool } from "@/content/tools";

/**
 * Every free tool, in the groups shown on /tools. The same list decides the
 * breadcrumb and the "Related tools" on each tool page, so adding a tool here
 * is enough for it to appear everywhere.
 */

type ToolMeta = { slug: string; name: string; cardLine: string };

export type ToolEntry = ToolMeta & {
  /** Card button text. */
  action: string;
  /** Extra search words, including common Hindi and Hinglish terms. */
  keywords: string;
  /** The tool in the same group most like this one; listed first in related tools. */
  closest?: string;
};

export type ToolGroup = {
  id: string;
  /** The group's own page: /tools/<slug>. */
  slug: string;
  title: string;
  description: string;
  /** Group page SEO title and description. */
  metaTitle: string;
  metaDescription: string;
  tools: readonly ToolEntry[];
  /** Tools from other groups used when this group has too few related tools. */
  fallback: readonly string[];
};

const entry = (tool: ToolMeta, action: string, keywords: string, closest?: string): ToolEntry => ({
  slug: tool.slug,
  name: tool.name,
  cardLine: tool.cardLine,
  action,
  keywords,
  ...(closest ? { closest } : {}),
});

export const toolGroups: readonly ToolGroup[] = [
  {
    id: "loans",
    slug: "loans-and-credit",
    title: "Loans & credit",
    description: "Plan your EMI, see what paying early saves, and what card debt really costs.",
    metaTitle: "Loan & Credit Calculators — EMI, Prepayment, Credit Card | AQVIK",
    metaDescription:
      "Free loan and credit calculators: EMI with a repayment schedule, loan prepayment savings, and what paying only the credit card minimum really costs.",
    tools: [
      entry(emiTool, "Open calculator", "loan home car personal kist instalment interest byaj"),
      entry(prepaymentTool, "Open calculator", "loan emi part payment foreclosure interest saved byaj kist"),
      entry(creditCardTool, "Open calculator", "credit card minimum due interest debt"),
    ],
    fallback: ["sip-calculator"],
  },
  {
    id: "savings",
    slug: "savings-and-investing",
    title: "Savings & investing",
    description: "See how monthly investing and bank deposits grow, and how long withdrawals last.",
    metaTitle: "Savings & Investment Calculators — SIP, SWP, FD, RD | AQVIK",
    metaDescription:
      "Free SIP, SWP, FD and RD calculators: see what monthly investing or a bank deposit could grow to, and how long a monthly withdrawal lasts.",
    tools: [
      entry(sipTool, "Open calculator", "mutual fund investment returns step-up monthly"),
      entry(swpTool, "Open calculator", "withdrawal retirement pension corpus monthly income"),
      entry(fdTool, "Open calculator", "fixed deposit bank interest maturity", "rd-calculator"),
      entry(rdTool, "Open calculator", "recurring deposit bank monthly saving interest", "fd-calculator"),
    ],
    fallback: [],
  },
  {
    id: "business",
    slug: "business-and-gst",
    title: "Business & GST",
    description: "Tax invoices, GST sums and the other documents a GST-registered business issues.",
    metaTitle: "GST Tools for Business — Invoice, Bill of Supply, Challan, Notes | AQVIK",
    metaDescription:
      "Free GST tools: tax invoice generator, GST calculator, Bill of Supply, credit and debit notes, and delivery challan. PDFs made in your browser.",
    tools: [
      entry(gstInvoiceTool, "Open maker", "invoice bill tax invoice gst pdf excel business dukan"),
      entry(gstCalcTool, "Open calculator", "tax add remove inclusive exclusive cgst sgst igst"),
      entry(billOfSupplyTool, "Open maker", "bill of supply composition dealer exempt gst bos bill"),
      entry(noteTool, "Open maker", "credit note debit note sales return discount gst correction wapsi"),
      entry(deliveryChallanTool, "Open maker", "delivery challan job work dc goods transport maal bhejna chalan"),
    ],
    fallback: [],
  },
  {
    id: "bills",
    slug: "bills-and-receipts",
    title: "Bills & receipts",
    description: "Simple bills, quotations and rent receipts, with no GST registration needed.",
    metaTitle: "Free Bill, Quotation & Rent Receipt Makers | AQVIK",
    metaDescription:
      "Make a simple bill or cash memo, a quotation with a valid-until date, or monthly rent receipts for HRA. Free PDFs, made in your browser.",
    tools: [
      entry(billMakerTool, "Open maker", "bill cash memo receipt invoice without gst no gst dukan shop kirana"),
      entry(quotationTool, "Open maker", "quotation estimate quote rate offer business"),
      entry(rentReceiptTool, "Open generator", "rent receipt hra house rent kiraya landlord makan malik tax"),
    ],
    fallback: ["gst-invoice-generator"],
  },
];

export function findGroup(id: string): ToolGroup {
  const group = toolGroups.find((g) => g.id === id);
  if (!group) throw new Error(`Unknown tool group: ${id}`);
  return group;
}

export function groupOf(slug: string): ToolGroup | undefined {
  return toolGroups.find((group) => group.tools.some((tool) => tool.slug === slug));
}

function findTool(slug: string): ToolEntry | undefined {
  for (const group of toolGroups) {
    const tool = group.tools.find((t) => t.slug === slug);
    if (tool) return tool;
  }
  return undefined;
}

/** Up to three other tools: the same group first (closest match leading), then the group's fallback. */
export function relatedTools(slug: string, limit = 3): ToolEntry[] {
  const group = groupOf(slug);
  if (!group) return [];
  const closest = group.tools.find((t) => t.slug === slug)?.closest;
  const sameGroup = group.tools
    .filter((t) => t.slug !== slug)
    .sort((a, b) => Number(b.slug === closest) - Number(a.slug === closest));
  const extra = group.fallback.map(findTool).filter((t): t is ToolEntry => t !== undefined);
  return [...sameGroup, ...extra].slice(0, limit);
}

export const toolCount = toolGroups.reduce((n, g) => n + g.tools.length, 0);
