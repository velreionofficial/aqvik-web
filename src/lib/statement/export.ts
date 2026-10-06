import { TYPE_LABEL } from "./engine/catalog";
import type { ClassifiedTxn, FinancialFacts, Insights } from "./engine";
import { maskText } from "./mask";

/** Excel and PDF of an analysed statement, built only from the financial facts; libraries load on click. */

const rupees = (paise: number) => `${paise < 0 ? "-" : ""}${(Math.abs(paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const band = (c: number) => (c >= 0.8 ? "High" : c >= 0.5 ? "Medium" : "Low");

export function summaryRows(f: FinancialFacts): [string, string][] {
  return [
    ["Money in (bank)", rupees(f.raw.moneyIn)],
    ["Money out (bank)", rupees(f.raw.moneyOut)],
    ["Net (in − out)", rupees(f.netCashFlow)],
    ...f.moneyInParts.map((p) => [`  In: ${p.label}`, rupees(p.amount)] as [string, string]),
    ...f.moneyOutParts.map((p) => [`  Out: ${p.label}`, rupees(p.amount)] as [string, string]),
    ["True income", rupees(f.trueIncome)],
    ["Actual spending (after linked refunds)", rupees(f.actualSpending)],
    ["Confirmed investments", rupees(f.investmentsConfirmed)],
    ["Sent to investment platforms (not confirmed as invested)", rupees(f.brokerFunding)],
    ["Debt payments", rupees(f.debtPayments)],
    ["Transfers out", rupees(f.transfersOut)],
    ["Cash withdrawals", rupees(f.cashWithdrawals)],
    ["Refunds", rupees(f.refundsLinked + f.refundsUnlinked)],
    ["Fees and charges", rupees(f.fees)],
    ["Interest received", rupees(f.interest)],
    ["Unclassified money out", rupees(f.unknownOut)],
    ["Regular payments (≈ per month)", rupees(f.commitments.monthly)],
    ["Regular payments (≈ per year)", rupees(f.commitments.annual)],
  ];
}

export async function statementXlsx(f: FinancialFacts, txns: ClassifiedTxn[], note: string, insights: Insights | null = null): Promise<Blob> {
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = "AQVIK";
  const s = wb.addWorksheet("Summary");
  s.columns = [{ width: 52 }, { width: 18 }, { width: 10 }];
  s.addRow(["Your money report"]).font = { bold: true, size: 14 };
  s.addRow([`${f.period.from} to ${f.period.to} · ${f.count} transactions`]);
  s.addRow(["Money out is not the same as spending: it also includes transfers, investment platforms, debt payments and cash."]);
  s.addRow([]);
  if (insights) {
    s.addRow(["What happened"]).font = { bold: true };
    for (const l of insights.story) s.addRow([l.text]);
    s.addRow([]);
  }
  for (const [k, v] of summaryRows(f)) s.addRow([k, v]);
  const block = (title: string, rows: { key: string; amount: number; count: number }[]) => {
    s.addRow([]);
    s.addRow([title, "Amount", "Count"]).font = { bold: true };
    for (const b of rows) s.addRow([b.key, rupees(b.amount), b.count]);
  };
  block("Spending by category", f.spendingByCategory);
  block("Transfers out", f.transfersOutByCategory);
  block("Debt payments", f.debtByCategory);
  block("Bank & financial charges", f.feesByCategory);
  s.addRow([]);
  s.addRow(["Regular payments", "Typical", "Frequency", "≈ per year", "Next (estimate)"]).font = { bold: true };
  for (const r of f.recurring.filter((x) => x.direction === "out")) s.addRow([r.counterparty, rupees(r.typical), r.frequency, rupees(r.annualized), r.nextEstimate]);
  s.addRow([]);
  s.addRow(["Subscriptions", "Typical", "Frequency", "≈ per year"]).font = { bold: true };
  for (const x of f.subscriptions) s.addRow([x.counterparty, rupees(x.typical), x.frequency, x.annualized === null ? "unknown" : rupees(x.annualized)]);
  s.addRow([]);
  s.addRow(["Comes in regularly", "Typical", "Frequency"]).font = { bold: true };
  for (const r of f.recurring.filter((x) => x.direction === "in")) s.addRow([r.counterparty, rupees(r.typical), r.frequency]);
  if (insights) {
    s.addRow([]);
    s.addRow(["Health snapshot (this statement only)", "Value", "Level"]).font = { bold: true };
    for (const h of insights.health) s.addRow([h.label, h.value, h.level]);
    s.addRow([]);
    s.addRow(["Worth a look", "Detail", "Level"]).font = { bold: true };
    for (const i of [...insights.unusual, ...insights.leaks]) s.addRow([i.title, i.detail, i.level]);
    s.addRow([]);
    s.addRow(["Review checklist"]).font = { bold: true };
    for (const c of insights.checklist) s.addRow([`☐ ${c.text}`]);
  }
  const review = wb.addWorksheet("To review");
  review.columns = [{ header: "Date", width: 12 }, { header: "Description (masked)", width: 60 }, { header: "Type", width: 16 }, { header: "Category", width: 24 }, { header: "Why", width: 50 }, { header: "Amount", width: 14 }];
  review.getRow(1).font = { bold: true };
  for (const x of txns.filter((t) => !t.c.duplicateOf && (t.c.confidence < 0.5 || t.c.type === "UNKNOWN"))) {
    review.addRow([x.date, maskText(x.description), TYPE_LABEL[x.c.type], x.c.category, x.c.reasons[0] ?? "", (x.debit ? -x.debit : x.credit) / 100]);
  }
  s.addRow([]);
  s.addRow([note]).font = { italic: true };

  const t = wb.addWorksheet("Transactions");
  t.columns = [
    { header: "Date", width: 12 },
    { header: "Description (masked)", width: 60 },
    { header: "Amount (₹, − out / + in)", width: 18 },
    { header: "Type", width: 16 },
    { header: "Category", width: 24 },
    { header: "Counterparty", width: 26 },
    { header: "Counterparty kind", width: 18 },
    { header: "Confidence", width: 12 },
    { header: "Reason", width: 50 },
  ];
  t.getRow(1).font = { bold: true };
  for (const x of txns) {
    if (x.c.duplicateOf) continue;
    t.addRow([x.date, maskText(x.description), (x.credit - x.debit) / 100, TYPE_LABEL[x.c.type], x.c.category, x.c.counterparty.name, x.c.counterparty.kind.replace(/_/g, " "), band(x.c.confidence), x.c.reasons[0] ?? ""]);
  }
  t.getColumn(3).numFmt = "#,##,##0.00";
  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

type AutoTableDoc = { lastAutoTable: { finalY: number } };

async function fontBase64(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function statementPdf(f: FinancialFacts, note: string, insights: Insights | null = null): Promise<Blob> {
  const [{ jsPDF }, { autoTable }, regular, semibold] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    fontBase64("/fonts/Geist-Regular.ttf"),
    fontBase64("/fonts/Geist-SemiBold.ttf"),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("Geist-Regular.ttf", regular);
  doc.addFont("Geist-Regular.ttf", "Geist", "normal");
  doc.addFileToVFS("Geist-SemiBold.ttf", semibold);
  doc.addFont("Geist-SemiBold.ttf", "Geist", "bold");
  const margin = 14;
  const lastY = () => (doc as unknown as AutoTableDoc).lastAutoTable.finalY;
  const base = {
    theme: "grid" as const,
    margin: { left: margin, right: margin, bottom: 16 },
    styles: { font: "Geist", fontSize: 8.5, cellPadding: 1.8, lineColor: [210, 210, 210] as [number, number, number], lineWidth: 0.2, textColor: [20, 20, 20] as [number, number, number] },
    headStyles: { font: "Geist", fontStyle: "bold" as const, fillColor: [240, 242, 245] as [number, number, number], textColor: [20, 20, 20] as [number, number, number] },
    columnStyles: { 1: { halign: "right" as const }, 2: { halign: "right" as const } },
  };
  doc.setFont("Geist", "bold");
  doc.setFontSize(15);
  doc.text("Your money report", margin, 18);
  doc.setFont("Geist", "normal");
  doc.setFontSize(9);
  doc.text(`${f.period.from} to ${f.period.to} · ${f.count} transactions · amounts in ₹`, margin, 24);
  doc.text("Money out is not the same as spending: it also includes transfers, investment platforms, debt payments and cash.", margin, 29);
  let startY = 33;
  if (insights) {
    const story = doc.splitTextToSize(insights.story.map((l) => `• ${l.text}`).join("\n"), 182);
    doc.text(story, margin, startY + 2);
    startY += story.length * 4 + 4;
  }
  autoTable(doc, { ...base, startY, body: summaryRows(f) });
  const table = (head: string[], body: string[][]) => body.length && autoTable(doc, { ...base, startY: lastY() + 5, head: [head], body });
  table(["Income by source", "Amount", "Count"], f.incomeBySource.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Spending by category", "Amount", "Count"], f.spendingByCategory.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Investments (confirmed)", "Amount", "Count"], f.investmentsByCategory.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Debt payments", "Amount", "Count"], f.debtByCategory.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Transfers out", "Amount", "Count"], f.transfersOutByCategory.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Regular payments", "Typical", "≈ per year"], f.recurring.filter((r) => r.direction === "out").map((r) => [`${r.counterparty} (${r.frequency})`, rupees(r.typical), rupees(r.annualized)]));
  table(["Subscriptions", "Typical", "≈ per year"], f.subscriptions.map((x) => [`${x.counterparty} (${x.frequency})`, rupees(x.typical), x.annualized === null ? "unknown" : rupees(x.annualized)]));
  table(["Bank & financial charges", "Amount", "Count"], f.feesByCategory.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Top merchants", "Amount", "Count"], f.topMerchants.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Sent to people", "Amount", "Count"], f.topPeopleOut.map((b) => [b.key, rupees(b.amount), String(b.count)]));
  table(["Month", "Income", "Spending"], f.monthly.map((m) => [`${m.month}${m.partial ? " (part)" : ""}`, rupees(m.income), rupees(m.spending)]));
  if (insights) {
    table(["Health snapshot (this statement only)", "Value", "Level"], insights.health.map((h) => [h.label, h.value, h.level]));
    autoTable(doc, {
      ...base,
      startY: lastY() + 5,
      columnStyles: { 2: { halign: "right" as const } },
      head: [["Worth a look", "Detail", "Level"]],
      body: [...insights.unusual, ...insights.leaks].map((i) => [i.title, i.detail, i.level]),
    });
    autoTable(doc, { ...base, startY: lastY() + 5, columnStyles: {}, head: [["Review checklist"]], body: insights.checklist.map((c) => [`☐ ${c.text}`]) });
  }
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(note, 182), margin, lastY() + 7);
  return doc.output("blob");
}
