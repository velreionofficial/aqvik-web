import type { CounterpartyKind } from "./model.ts";

/**
 * Counterparty kind from the counterparty's NAME, not the whole description. Paytm prints the
 * user's own bank ("State Bank Of India - 12") on every line, so matching the full description
 * would make every payment a "bank". Order matters: the first group that matches wins.
 * Whole words only, so "STORE" does not match "RESTORE" and "LIC" does not match "PUBLIC".
 */
const GROUPS: [CounterpartyKind, string[]][] = [
  ["government", ["GOVT", "GOVERNMENT", "PFMS", "NTRP", "CGA", "MINISTRY", "TREASURY", "INCOME TAX", "INCOMETAX", "CBDT", "GSTN", "EPFO", "UIDAI", "MUNICIPAL", "NAGAR NIGAM", "NAGAR PALIKA", "COLLECTORATE", "PASSPORT SEVA", "GOI", "GOVT OF"]],
  ["bank", ["BANK", "STATE BANK", "BANK LTD", "BANK LIMITED", "GRAMIN BANK", "CO OP BANK", "COOPERATIVE BANK"]],
  ["insurance", ["INSURANCE", "LIC", "ASSURANCE", "LIFE INSURANCE", "GENERAL INSURANCE"]],
  ["lender", ["FINANCE", "FINSERV", "FINCORP", "FINANCIAL SERVICES", "CAPITAL", "LOANS", "LOAN", "NBFC", "MICROFINANCE", "HOME CREDIT"]],
  ["broker", ["SECURITIES", "BROKING", "STOCK BROKERS", "SHARE BROKERS"]],
  ["healthcare", ["HOSPITAL", "CLINIC", "PHARMACY", "PHARMA", "MEDICAL", "MEDICOS", "MEDICALS", "DIAGNOSTIC", "DIAGNOSTICS", "PATHOLOGY", "NURSING HOME", "DENTAL"]],
  ["education", ["SCHOOL", "COLLEGE", "UNIVERSITY", "ACADEMY", "INSTITUTE", "COACHING", "TUITION", "VIDYALAYA", "CLASSES"]],
  ["hospitality", ["HOTEL", "HOTELS", "RESORT", "LODGE", "GUEST HOUSE", "GUESTHOUSE", "RESTAURANT", "DHABA", "CAFE", "BHOJANALAYA"]],
  ["utility", ["ELECTRICITY", "VIDYUT", "POWER", "WATER BOARD", "JAL BOARD", "GAS AGENCY", "BROADBAND", "AIRTEL", "JIO", "BSNL", "VODAFONE"]],
  ["wallet", ["WALLET"]],
  ["merchant", ["STORE", "STORES", "MART", "TRADERS", "TRADING", "ENTERPRISE", "ENTERPRISES", "SHOP", "BAZAAR", "BAZAR", "KIRANA", "GENERAL STORE", "ELECTRONICS", "HARDWARE", "SUPERMARKET", "MOBILES", "TELECOM", "AGENCIES", "AGENCY", "EMPORIUM", "BOUTIQUE", "SWEETS", "BAKERY", "CINEMA", "CINEMAS", "MULTIPLEX", "PVR", "INOX"]],
  ["other_institution", ["PVT", "PRIVATE", "LTD", "LIMITED", "LLP", "TRUST", "FOUNDATION", "SOCIETY", "CORPORATION", "ASSOCIATION", "SERVICES", "SOLUTIONS", "TECHNOLOGIES", "INDUSTRIES", "COMPANY"]],
];

const RE = new Map<string, RegExp>();
const word = (w: string) => {
  let re = RE.get(w);
  if (!re) {
    re = new RegExp(`(^|[^A-Z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Z0-9]|$)`);
    RE.set(w, re);
  }
  return re;
};

/** Government payment systems that identify the other side even when the name is cut short. */
const GOVT_SYSTEMS = ["PFMS", "NTRP", "EPFO", "UIDAI", "CBDT", "GOVT OF", "GOVERNMENT OF", "TREASURY"];

export function kindFromName(name: string, description = ""): { kind: CounterpartyKind; word: string } | null {
  const n = ` ${name.toUpperCase().replace(/[^A-Z0-9& ]+/g, " ").replace(/\s+/g, " ")} `;
  for (const [kind, words] of GROUPS) {
    const w = words.find((x) => word(x).test(n));
    if (w) return { kind, word: w };
  }
  // Only government payment systems are read from the description; never "bank".
  const d = ` ${description.toUpperCase().replace(/\s+/g, " ")} `;
  const g = GOVT_SYSTEMS.find((x) => word(x).test(d));
  return g ? { kind: "government", word: g } : null;
}
