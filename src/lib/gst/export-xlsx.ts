import type { InvoiceView } from "./view";

/**
 * Builds the .xlsx in the browser with exceljs (loaded only on click): an
 * Invoice sheet with the header block, line items and totals, and a Tax
 * summary sheet by GST rate. Amounts are real numbers with an Indian format.
 */

const INR = '[>=10000000]##\\,##\\,##\\,##0.00;[>=100000]##\\,##\\,##0.00;##,##0.00';

export async function downloadInvoiceXlsx(view: InvoiceView, fileName: string): Promise<void> {
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = view.supplier.name;

  const sheet = workbook.addWorksheet("Invoice");
  sheet.columns = [
    { width: 5 }, { width: 34 }, { width: 11 }, { width: 9 }, { width: 7 }, { width: 13 },
    { width: 8 }, { width: 15 }, { width: 8 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 15 },
  ];

  const title = sheet.addRow([view.title]);
  title.font = { bold: true, size: 14 };
  sheet.addRow([view.copyLabel]);
  sheet.addRow([]);

  const pair = (label: string, value: string) => {
    const row = sheet.addRow(["", label, value]);
    row.getCell(2).font = { bold: true };
  };
  if (view.supplier.tradeName) {
    const trade = sheet.addRow([view.supplier.tradeName]);
    trade.font = { bold: true, size: 13 };
  }
  pair("Supplier", view.supplier.name);
  pair("Address", view.supplier.address);
  pair("GSTIN", view.supplier.gstin);
  pair("State", view.supplier.state);
  if (view.supplier.phone) pair("Phone", view.supplier.phone);
  for (const [k, v] of view.details) pair(k, v);
  sheet.addRow([]);
  pair("Bill to", view.billTo.name);
  pair("Address", view.billTo.address);
  pair("GSTIN", view.billTo.gstin);
  if (view.billTo.state) pair("State", view.billTo.state);
  if (view.billTo.phone) pair("Phone", view.billTo.phone);
  if (view.shipTo) {
    pair("Ship to", view.shipTo.name);
    pair("Address", view.shipTo.address);
    if (view.shipTo.state) pair("State", view.shipTo.state);
  }
  sheet.addRow([]);

  const head = sheet.addRow([
    "#", "Description", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Disc. %", "Taxable (₹)", "GST %",
    "CGST (₹)", `${view.stateTaxLabel} (₹)`, "IGST (₹)", "Total (₹)",
  ]);
  head.font = { bold: true };
  view.lines.forEach((line, index) => {
    const n = view.numbers.lines[index]!;
    const row = sheet.addRow([
      line.sno, line.kindLabel ? `${line.description} (${line.kindLabel})` : line.description, line.hsn, n.quantity, line.unit, n.rate, n.discountPct,
      n.taxable, n.gstPct, n.cgst, n.sgst, n.igst, n.total,
    ]);
    for (const col of [6, 8, 10, 11, 12, 13]) row.getCell(col).numFmt = INR;
  });
  sheet.addRow([]);

  const total = (label: string, value: number, bold = false) => {
    const row = sheet.addRow(["", "", "", "", "", "", "", "", "", "", "", label, value]);
    row.getCell(13).numFmt = INR;
    if (bold) row.font = { bold: true };
  };
  total("Taxable value", view.numbers.taxable);
  total("CGST", view.numbers.cgst);
  total(view.stateTaxLabel, view.numbers.sgst);
  total("IGST", view.numbers.igst);
  if (view.totals.some(([k]) => k === "Round off")) total("Round off", view.numbers.roundOff);
  total("Grand total", view.numbers.grandTotal, true);
  sheet.addRow([]);
  pair("Amount in words", view.words);
  if (view.bank.length) for (const [k, v] of view.bank) pair(k, v);
  if (view.notes) pair("Notes / terms", view.notes);
  if (view.reverseChargeNote) pair("Reverse charge", view.reverseChargeNote);
  if (view.declaration) pair("Declaration", view.declaration);
  sheet.addRow([]);
  pair("Authorised Signatory", `For ${view.signatoryFor}`);

  const summary = workbook.addWorksheet("Tax summary");
  summary.columns = [{ width: 10 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }];
  const sHead = summary.addRow(["GST %", "Taxable value (₹)", "CGST (₹)", `${view.stateTaxLabel} (₹)`, "IGST (₹)"]);
  sHead.font = { bold: true };
  for (const r of view.numbers.summary) {
    const row = summary.addRow([r.gstPct, r.taxable, r.cgst, r.sgst, r.igst]);
    for (const col of [2, 3, 4, 5]) row.getCell(col).numFmt = INR;
  }
  const sTotal = summary.addRow(["Total", view.numbers.taxable, view.numbers.cgst, view.numbers.sgst, view.numbers.igst]);
  sTotal.font = { bold: true };
  for (const col of [2, 3, 4, 5]) sTotal.getCell(col).numFmt = INR;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as unknown as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
