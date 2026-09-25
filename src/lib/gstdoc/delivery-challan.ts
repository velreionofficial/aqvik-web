import { checkGstin } from "../gst/gstin.ts";
import type { LineDraft } from "../gst/invoice.ts";
import { formatPaise } from "../gst/money.ts";
import { findState } from "../gst/states.ts";
import {
  checkDocNumber,
  computeLines,
  displayDate,
  stateText,
  taxTable,
  taxTotals,
  validateLines,
  valueTable,
  type Errors,
  type LineTotals,
} from "./lines.ts";
import { lines as nonEmpty, type DocView } from "./view.ts";

/**
 * Delivery challan (CGST Rule 55): goods moved without a tax invoice. The
 * rule lists the purposes, the particulars (number and date, consigner and
 * consignee, HSN and description, quantity, taxable value, tax where the
 * movement is for supply, place of supply if inter-State, signature) and the
 * three copy markings.
 */

export const CHALLAN_PURPOSES = [
  { value: "job-work", label: "Sending goods for job work", supply: false },
  { value: "not-supply", label: "Moving goods for a reason other than supply", supply: false },
  { value: "liquid-gas", label: "Supply of liquid gas, quantity not known at removal", supply: true },
  { value: "invoice-later", label: "Supply where the tax invoice will be issued after delivery", supply: true },
  { value: "notified", label: "Other supply notified by CBIC", supply: true },
] as const;
export type ChallanPurpose = "" | (typeof CHALLAN_PURPOSES)[number]["value"];

export const CHALLAN_COPIES = ["ORIGINAL FOR CONSIGNEE", "DUPLICATE FOR TRANSPORTER", "TRIPLICATE FOR CONSIGNER"] as const;

type Party = { registered: boolean; name: string; address: string; gstin: string; stateCode: string };

export type ChallanDraft = {
  purpose: ChallanPurpose;
  copy: (typeof CHALLAN_COPIES)[number];
  consigner: Party;
  consignee: Party;
  number: string;
  date: string;
  provisionalQuantity: boolean;
  lines: LineDraft[];
  transport: { vehicle: string; transporter: string; eWayBill: string };
  notes: string;
};

export const isSupplyPurpose = (purpose: ChallanPurpose) =>
  CHALLAN_PURPOSES.some((p) => p.value === purpose && p.supply);

/** State of a party: from its GSTIN when registered, else the one chosen. */
export function partyState(party: Party): string {
  if (party.registered) {
    const check = checkGstin(party.gstin);
    return check.ok ? check.stateCode : "";
  }
  return party.stateCode;
}

export type ChallanResult = LineTotals & { intraState: boolean; withTax: boolean; utgst: boolean };

export function computeChallan(draft: ChallanDraft): ChallanResult | null {
  const from = partyState(draft.consigner);
  const to = partyState(draft.consignee);
  if (!from || !to) return null;
  const intraState = from === to;
  const withTax = isSupplyPurpose(draft.purpose);
  const totals = computeLines(draft.lines, intraState, withTax);
  if (!totals) return null;
  return { ...totals, intraState, withTax, utgst: Boolean(findState(to)?.utgst) };
}

function validateParty(party: Party, prefix: string, who: string, errors: Errors, needNameAddress: boolean) {
  if (needNameAddress || party.registered) {
    if (party.name.trim() === "") errors[`${prefix}.name`] = `Enter the ${who}'s name.`;
    if (party.address.trim() === "") errors[`${prefix}.address`] = `Enter the ${who}'s address.`;
  }
  if (party.registered) {
    const check = checkGstin(party.gstin, { allowUinMessage: prefix === "consignee" });
    if (!check.ok) errors[`${prefix}.gstin`] = check.error;
  } else if (!party.stateCode) {
    errors[`${prefix}.stateCode`] = `Choose the ${who}'s state.`;
  }
}

export function validateChallan(draft: ChallanDraft): Errors {
  const errors: Errors = {};
  if (!draft.purpose) errors.purpose = "Choose why the goods are being moved.";
  validateParty(draft.consigner, "consigner", "consigner", errors, true);
  validateParty(draft.consignee, "consignee", "consignee", errors, true);
  const numberError = checkDocNumber(draft.number, "challan");
  if (numberError) errors.number = numberError;
  if (draft.date.trim() === "") errors.date = "Enter the date.";
  validateLines(
    draft.lines.map((l) => ({ ...l, kind: "goods" as const })),
    "upto5",
    true,
    isSupplyPurpose(draft.purpose),
    errors,
  );
  return errors;
}

export function buildChallanView(draft: ChallanDraft, result: ChallanResult): DocView {
  const party = (p: Party) =>
    nonEmpty(p.name, p.address, p.registered ? `GSTIN: ${p.gstin.trim().toUpperCase()}` : `State: ${stateText(p.stateCode)}`);
  const purpose = CHALLAN_PURPOSES.find((p) => p.value === draft.purpose)?.label ?? "";
  const table = result.withTax
    ? taxTable(result, result.intraState, result.utgst, draft.provisionalQuantity)
    : valueTable(result, draft.provisionalQuantity);
  const details: [string, string][] = [
    ["Challan No.", draft.number.trim()],
    ["Date", displayDate(draft.date)],
    ["Purpose", purpose],
  ];
  if (!result.intraState) details.push(["Place of supply", stateText(partyState(draft.consignee))]);
  if (draft.transport.vehicle.trim()) details.push(["Vehicle No.", draft.transport.vehicle.trim().toUpperCase()]);
  if (draft.transport.transporter.trim()) details.push(["Transporter", draft.transport.transporter.trim()]);
  if (draft.transport.eWayBill.trim()) details.push(["E-way bill No.", draft.transport.eWayBill.trim()]);

  const extras = [
    ...nonEmpty(
      draft.provisionalQuantity && "Quantities are provisional; the exact quantity was not known at the time of removal.",
      draft.purpose === "invoice-later" && "A tax invoice will be issued after delivery of the goods.",
    ).map((text) => ({ label: "Note", text })),
    ...(draft.notes.trim() ? [{ label: "Notes", text: draft.notes.trim() }] : []),
  ];

  return {
    title: "DELIVERY CHALLAN",
    copyLabel: draft.copy,
    issuer: { heading: "Consigner", lines: party(draft.consigner) },
    details,
    parties: [{ heading: "Consignee", lines: party(draft.consignee) }],
    ...table,
    totals: result.withTax ? taxTotals(result, result.intraState, result.utgst) : [],
    grand: [result.withTax ? "Total value with tax" : "Total value", `₹${formatPaise(result.withTax ? result.total : result.taxable)}`],
    extras,
    signatoryFor: draft.consigner.name.trim(),
  };
}
