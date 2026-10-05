import { findOpeningBalance, type Txn } from "./detect.ts";
import { parseAmount, parseDate } from "./parse.ts";

/**
 * Fallback for PDFs that are not laid out as a table, typically UPI app
 * statements (Paytm, Google Pay, PhonePe) where each line is one piece of
 * text. A transaction starts on a line that begins with a date; the lines
 * after it, up to the next date, belong to it. The amount is the money
 * figure on those lines, and its direction comes from a sign or from words
 * such as "Paid to" / "Received from" / "Debit" / "Credit".
 */

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december";
const DATE_AT_START = new RegExp(
  `^\\s*(\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[\\s-]*(?:${MONTHS})\\b(?:[\\s,'’-]+\\d{4}|\\s*['’]\\s*\\d{2})?|(?:${MONTHS})\\s+\\d{1,2},?\\s+\\d{4})`,
  "i",
);
// A money figure with ₹/Rs/INR (optionally signed or Cr/Dr), or a sign written against a
// number ("-456.00"). A lone "-" followed by a space is how bank PDFs mark an empty
// Debit or Credit cell, so it is not a sign.
const MONEY = /([-+−]\s*)?(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)(\s*(?:cr|dr)\b)?|(?<![\w.,])([-+−])([\d,]+\.\d{2})\b/gi;
// Page footers and headers, totals and balance lines: never part of an entry.
// Covers "Page 1", "Page 1 of 9", "Page no. 1", "Page No: 1 Balance ..." and similar.
const NOISE = /^(.*\bpage\s*(no\.?|number)?\s*[:.]?\s*\d+\b.*|date\s*(&|and)?\s*time\b.*|transaction details.*|date\s+transaction.*|txn date\b.*|.*\bstatement\b.*\d{4}.*|.*\b(total|grand total|closing balance|opening balance|carried forward|brought forward|balance b\/?f|balance as on)\b.*)$/i;

const MONTH_NUM: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** The latest full date mentioned anywhere (statement period end), used to give "04 Oct" a year. */
export function latestFullDate(lines: string[]): string | null {
  let best: string | null = null;
  const re = new RegExp(`\\b(\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{4}|\\d{1,2}[\\s-]*(?:${MONTHS})[\\s,'’-]+(?:\\d{4}|\\d{2}(?!\\d|:))|(?:${MONTHS})\\s+\\d{1,2},?\\s+\\d{4})`, "gi");
  for (const line of lines) {
    for (const m of line.matchAll(re)) {
      const iso = parseDate(m[1]!);
      if (iso && (!best || iso > best)) best = iso;
    }
  }
  return best;
}

/** "04 Oct" with no year: the year of the period end, or the year before if that would be after it. */
function yearless(text: string, end: string): string | null {
  const m = new RegExp(`^\\s*(\\d{1,2})[\\s-]*(${MONTHS})\\b`, "i").exec(text);
  if (!m) return null;
  const month = MONTH_NUM[m[2]!.toLowerCase().slice(0, 3)];
  if (!month) return null;
  const endYear = Number(end.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  let iso = `${endYear}-${pad(month)}-${pad(Number(m[1]))}`;
  if (iso > end) iso = `${endYear - 1}-${pad(month)}-${pad(Number(m[1]))}`;
  return parseDate(iso);
}

function direction(text: string): "dr" | "cr" | null {
  const t = text.toLowerCase();
  if (/\b(received from|credited|credit|cashback|refund|added to|dep tfr|by transfer|by clg|by cash)\b|\/cr\//.test(t)) return "cr";
  if (/\b(paid to|sent to|debited|debit|paid|transfer to|bill paid|recharge|wdl tfr|to transfer|atm wdl)\b|\/dr\//.test(t)) return "dr";
  return null;
}

export type LineExtraction = {
  txns: Txn[];
  skipped: number;
  /**
   * "signed": UPI-app style, a sign and ₹/Rs on every payment (no balances to check against);
   * "balance": amount then balance, direction from the balance; "other": anything else,
   * which must pass the balance check like any bank statement.
   */
  method: "signed" | "balance" | "other";
};

const KEEP = /^(paid|to|received|from|sent|rs\.?|inr|₹|debit|credit|dr|cr|upi|id|ref|no\.?|date|time|amount|am|pm|transaction|details|page|of|txn|value|description|narration|particulars|balance|withdrawal|deposit|cheque|chq|by|transfer|neft|imps|rtgs|atm|opening|closing|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)$/i;

/** Structure-only view of the first lines: words kept only if generic, everything else masked. */
export function lineReport(lines: string[], extraction: LineExtraction): string {
  const shape = (line: string) =>
    line
      .split(/\s+/)
      .map((w) => (KEEP.test(w) ? w.toLowerCase() : w.replace(/[0-9]/g, "9").replace(/[^\s9.,:/'’+\-₹]/g, "a")))
      .join(" ")
      .slice(0, 90);
  return [
    `Lines: ${lines.length}; lines starting with a date: ${lines.filter((l) => DATE_AT_START.test(l)).length}`,
    `Read as lines: ${extraction.txns.length} transactions, ${extraction.skipped} skipped`,
    ...lines.slice(0, 18).map((l, i) => `${String(i + 1).padStart(2, "0")}: ${shape(l)}`),
    "--- around the first dated line ---",
    ...(() => {
      const first = lines.findIndex((l, i) => i > 18 && DATE_AT_START.test(l));
      if (first < 0) return [];
      return lines.slice(Math.max(0, first - 8), first + 6).map((l, i) => `${String(Math.max(0, first - 8) + i + 1).padStart(4, "0")}: ${shape(l)}`);
    })(),
  ].join("\n");
}

export function transactionsFromLines(lines: string[], today = new Date().toISOString().slice(0, 10)): LineExtraction {
  const end = latestFullDate(lines) ?? today;
  const blocks: { date: string; lines: string[] }[] = [];
  let skipped = 0;
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;
    const m = DATE_AT_START.exec(line);
    // A line that starts with a date range ("5 JUL'26 - 4 OCT'26 ...") is the statement period, not an entry.
    // Only with a "-", "–" or "to" between them: "1 Jul 2026 1 Jul 2026 ..." is a txn date plus a value date.
    const rest = m ? line.slice(m[0].length) : "";
    const isPeriod = m ? /^\s*(-|–|to)\s*/i.test(rest) && DATE_AT_START.test(rest.replace(/^\s*(-|–|to)\s*/i, "")) : false;
    const date = m && !isPeriod ? (parseDate(m[1]!) ?? yearless(m[1]!, end)) : null;
    if (date) {
      // Drop a value date that follows the transaction date.
      const after = line.slice(m![0].length);
      const second = DATE_AT_START.exec(after);
      blocks.push({ date, lines: [(second ? after.slice(second[0].length) : after).trim()] });
    }
    else if (blocks.length && !NOISE.test(line)) blocks[blocks.length - 1]!.lines.push(line);
    else skipped += 1;
  }

  // Bank PDFs (SBI and others) print plain figures: "... 456.00 12,044.00", i.e. amount then
  // balance, with no sign. Those entries get their direction from how the balance moves.
  const PLAIN = /(?<![\d,.])(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+\.\d{2})(?:\s*(cr|dr)\b)?(?![\d,])/gi;
  type Pending = { date: string; text: string; amount: number; balance: number | null; hint: "dr" | "cr" | null };
  const plainEntries: Pending[] = [];

  const txns: (Txn & { signed: boolean; app: boolean })[] = [];
  for (const b of blocks) {
    // The transaction amount is the first figure with a sign or Dr/Cr ("- Rs.89"); a plain
    // "₹500" can be part of the description, so it is used only if nothing is signed.
    type Hit = { paise: number; sign: "dr" | "cr" | null; text: string; currency: boolean };
    let found: Hit | null = null;
    let plain: Hit | null = null;
    for (const line of b.lines) {
      for (const m of line.matchAll(MONEY)) {
        const signText = (m[1] ?? m[4] ?? "").replace(/\s/g, "");
        const value = parseAmount(m[2] ?? m[5] ?? "");
        if (!value || value.paise === 0) continue;
        const tail = (m[3] ?? "").trim().toLowerCase();
        const sign: "dr" | "cr" | null =
          signText === "+" ? "cr" : signText === "-" || signText === "−" ? "dr" : tail === "cr" ? "cr" : tail === "dr" ? "dr" : null;
        const hit = { paise: Math.abs(value.paise), sign, text: m[0], currency: m[2] !== undefined };
        if (sign) {
          found = hit;
          break;
        }
        plain ??= hit;
      }
      if (found) break;
    }
    found ??= plain;
    if (!found) {
      const text = b.lines.join(" ");
      const figures = [...text.matchAll(PLAIN)].map((m) => {
        const v = parseAmount(m[1]!)!;
        return { paise: Math.abs(v.paise), mark: (m[2] ?? "").toLowerCase(), raw: m[0] };
      });
      // "Opening balance 10,000.00": not an entry, but the balance the first entry starts from.
      if (figures.length && /opening balance|balance b\/?f|brought forward|balance as on/i.test(text)) {
        const f = figures[figures.length - 1]!;
        plainEntries.push({ date: b.date, text: "", amount: 0, balance: f.mark === "dr" ? -f.paise : f.paise, hint: null });
        continue;
      }
      if (figures.length >= 1) {
        const balance = figures.length >= 2 ? figures[figures.length - 1]! : null;
        const amount = figures.length >= 2 ? figures[figures.length - 2]! : figures[0]!;
        let narration = text;
        for (const f of figures.slice(-2)) narration = narration.replace(f.raw, " ");
        plainEntries.push({
          date: b.date,
          text: narration.replace(/\s+/g, " ").trim(),
          amount: amount.paise,
          balance: balance ? (balance.mark === "dr" ? -balance.paise : balance.paise) : null,
          hint: amount.mark === "dr" || amount.mark === "cr" ? (amount.mark as "dr" | "cr") : direction(text),
        });
        continue;
      }
      skipped += 1;
      continue;
    }
    const text = b.lines.join(" ");
    const dir = found.sign ?? direction(text);
    if (!dir) {
      skipped += 1;
      continue;
    }
    const narration = text
      .replace(found.text, " ")
      .replace(/\b\d{1,2}:\d{2}(\s*[ap]\.?m\.?)?\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    txns.push({
      id: txns.length,
      date: b.date,
      narration: narration || "(no description)",
      debit: dir === "dr" ? found.paise : 0,
      credit: dir === "cr" ? found.paise : 0,
      balance: null,
      signed: found.sign !== null,
      app: found.sign !== null && found.currency,
    });
  }
  if (plainEntries.length && plainEntries.length >= txns.length) {
    // Is the file oldest-first or newest-first? Count which reading makes balances add up.
    let asc = 0;
    let desc = 0;
    for (let i = 1; i < plainEntries.length; i += 1) {
      const a = plainEntries[i - 1]!;
      const b = plainEntries[i]!;
      if (a.balance === null || b.balance === null) continue;
      if (Math.abs(b.balance - a.balance) === b.amount) asc += 1;
      if (Math.abs(a.balance - b.balance) === a.amount) desc += 1;
    }
    const newestFirst = desc > asc;
    // The printed opening balance ("Balance as on 1 Apr 2026: 770.11") stands before the oldest entry.
    const opening = findOpeningBalance(lines);
    const out: Txn[] = [];
    plainEntries.forEach((e, i) => {
      const earlierEntry = newestFirst ? plainEntries[i + 1] : plainEntries[i - 1];
      const earlier = earlierEntry ? earlierEntry.balance : opening;
      let dir: "dr" | "cr" | null = null;
      if (e.balance !== null && earlier !== null && Math.abs(e.balance - earlier) === e.amount) {
        dir = e.balance < earlier ? "dr" : "cr";
      } else dir = e.hint;
      if (e.amount === 0) return;
      if (!dir) {
        skipped += 1;
        return;
      }
      out.push({ id: 0, date: e.date, narration: e.text || "(no description)", debit: dir === "dr" ? e.amount : 0, credit: dir === "cr" ? e.amount : 0, balance: e.balance });
    });
    const ordered = newestFirst ? out.reverse() : out;
    return { txns: ordered.map((t, i) => ({ ...t, id: i })), skipped, method: "balance" };
  }

  // App statements (Paytm and others) give every real payment a "+" or "-". When almost all
  // entries are signed, the unsigned ones are notices (self transfers, AutoPay set-ups,
  // money blocked) rather than payments, so they are left out, as the app's own totals do.
  const signedCount = txns.filter((t) => t.signed).length;
  const appCount = txns.filter((t) => t.app).length;
  const kept = signedCount >= txns.length * 0.8 ? txns.filter((t) => t.signed) : txns;
  return {
    txns: kept.map((t, i) => ({ id: i, date: t.date, narration: t.narration, debit: t.debit, credit: t.credit, balance: t.balance })),
    skipped: skipped + (txns.length - kept.length),
    method: txns.length > 0 && appCount >= txns.length * 0.8 ? "signed" : "other",
  };
}
