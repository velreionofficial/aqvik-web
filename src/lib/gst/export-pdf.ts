import type { InvoiceView } from "./view";

/**
 * Builds the A4 PDF in the browser. jsPDF, jspdf-autotable and the font are
 * loaded only when the user clicks download. Geist is embedded because the
 * standard PDF fonts have no ₹ glyph.
 */

type AutoTableDoc = { lastAutoTable: { finalY: number } };

async function fontBase64(url: string): Promise<string> {
  const buffer = await (await fetch(url)).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function downloadInvoicePdf(view: InvoiceView, fileName: string): Promise<void> {
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
  doc.setFont("Geist", "normal");

  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const lastY = () => (doc as unknown as AutoTableDoc).lastAutoTable.finalY;

  const base = {
    theme: "grid" as const,
    margin: { left: margin, right: margin, bottom: 18 },
    styles: { font: "Geist", fontSize: 8.5, cellPadding: 2, lineColor: [200, 200, 200] as [number, number, number], lineWidth: 0.2, textColor: [20, 20, 20] as [number, number, number] },
    headStyles: { font: "Geist", fontStyle: "bold" as const, fillColor: [240, 242, 245] as [number, number, number], textColor: [20, 20, 20] as [number, number, number] },
  };

  // Title and copy label
  doc.setFont("Geist", "bold");
  doc.setFontSize(15);
  doc.text(view.title, pageWidth / 2, 17, { align: "center" });
  doc.setFont("Geist", "normal");
  doc.setFontSize(8);
  doc.text(view.copyLabel, pageWidth - margin, 17, { align: "right" });

  // Trade name, if given, shown large under the title like a letterhead.
  let top = 23;
  if (view.supplier.tradeName) {
    doc.setFont("Geist", "bold");
    doc.setFontSize(13);
    const lines = doc.splitTextToSize(view.supplier.tradeName, contentWidth);
    doc.text(lines, pageWidth / 2, 25, { align: "center" });
    doc.setFont("Geist", "normal");
    top = 25 + lines.length * 5.5;
  }

  // Supplier and invoice details
  autoTable(doc, {
    ...base,
    startY: top,
    head: [["Supplier", "Invoice details"]],
    body: [
      [
        [
          view.supplier.name,
          view.supplier.address,
          `GSTIN: ${view.supplier.gstin}`,
          `State: ${view.supplier.state}`,
          view.supplier.phone ? `Phone: ${view.supplier.phone}` : "",
        ].filter(Boolean).join("\n"),
        view.details.map(([k, v]) => `${k}: ${v}`).join("\n"),
      ],
    ],
    columnStyles: { 0: { cellWidth: contentWidth * 0.55 }, 1: { cellWidth: contentWidth * 0.45 } },
  });

  // Bill to / ship to
  const billTo = [
    view.billTo.name,
    view.billTo.address,
    `GSTIN: ${view.billTo.gstin}`,
    view.billTo.state ? `State: ${view.billTo.state}` : "",
    view.billTo.phone ? `Phone: ${view.billTo.phone}` : "",
  ].filter(Boolean).join("\n");
  autoTable(doc, {
    ...base,
    startY: lastY() + 3,
    head: [view.shipTo ? ["Bill to", "Ship to"] : ["Bill to"]],
    body: [
      view.shipTo
        ? [billTo, [view.shipTo.name, view.shipTo.address, view.shipTo.state ? `State: ${view.shipTo.state}` : ""].filter(Boolean).join("\n")]
        : [billTo],
    ],
  });

  // Line items: CGST, SGST/UTGST and IGST are always printed.
  autoTable(doc, {
    ...base,
    startY: lastY() + 3,
    styles: { ...base.styles, fontSize: 7, cellPadding: 1.4 },
    headStyles: { ...base.headStyles, fontSize: 7 },
    head: [["#", "Description", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Disc.", "Taxable (₹)", "GST", "CGST (₹)", `${view.stateTaxLabel} (₹)`, "IGST (₹)", "Total (₹)"]],
    body: view.lines.map((l) => [
      String(l.sno),
      l.kindLabel ? `${l.description}\n(${l.kindLabel})` : l.description,
      l.hsn,
      l.quantity,
      l.unit,
      l.rate,
      l.discount,
      l.taxable,
      l.gstRate,
      `${l.cgst.rate}\n${l.cgst.amount}`,
      `${l.sgst.rate}\n${l.sgst.amount}`,
      `${l.igst.rate}\n${l.igst.amount}`,
      l.total,
    ]),
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 15 },
      3: { cellWidth: 10, halign: "right" },
      4: { cellWidth: 9 },
      5: { cellWidth: 15, halign: "right" },
      6: { cellWidth: 9, halign: "right" },
      7: { cellWidth: 16, halign: "right" },
      8: { cellWidth: 9, halign: "right" },
      9: { cellWidth: 14, halign: "right" },
      10: { cellWidth: 14, halign: "right" },
      11: { cellWidth: 14, halign: "right" },
      12: { cellWidth: 16, halign: "right" },
    },
  });

  // Totals
  autoTable(doc, {
    ...base,
    startY: lastY() + 3,
    margin: { ...base.margin, left: margin + contentWidth * 0.5 },
    body: [...view.totals.map(([k, v]) => [k, v]), ["Grand total", `₹${view.grandTotal}`]],
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (data: { row: { index: number }; cell: { styles: { fontStyle: string } } }) => {
      if (data.row.index === view.totals.length) data.cell.styles.fontStyle = "bold";
    },
  });

  // Amount in words
  let y = lastY() + 6;
  doc.setFontSize(8.5);
  const words = doc.splitTextToSize(`Amount in words: ${view.words}`, contentWidth);
  if (y + words.length * 4 > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }
  doc.text(words, margin, y);
  y += words.length * 4 + 2;

  // Tax summary by rate
  autoTable(doc, {
    ...base,
    startY: y,
    head: [["GST rate", "Taxable value (₹)", "CGST (₹)", `${view.stateTaxLabel} (₹)`, "IGST (₹)"]],
    body: view.taxSummary.map((r) => [r.rate, r.taxable, r.cgst, r.sgst, r.igst]),
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  // Bank details and notes
  const extras: string[][] = [];
  if (view.bank.length) extras.push(["Bank details", view.bank.map(([k, v]) => `${k}: ${v}`).join("\n")]);
  if (view.notes) extras.push(["Notes / terms", view.notes]);
  if (extras.length) {
    autoTable(doc, {
      ...base,
      startY: lastY() + 3,
      body: extras,
      columnStyles: { 0: { cellWidth: 32, fontStyle: "bold" } },
    });
  }

  // Reverse charge statement and Rule 46(s) declaration
  y = lastY() + 8;
  if (view.reverseChargeNote) {
    doc.setFontSize(8.5);
    const note = doc.splitTextToSize(view.reverseChargeNote, contentWidth);
    doc.text(note, margin, y);
    y += note.length * 4 + 3;
  }
  if (view.declaration) {
    doc.setFontSize(8);
    const declaration = doc.splitTextToSize(`Declaration: ${view.declaration}`, contentWidth);
    if (y + declaration.length * 3.6 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(declaration, margin, y);
    y += declaration.length * 3.6 + 4;
  }

  // Signature block
  const blockHeight = view.signature ? 34 : 22;
  if (y + blockHeight > pageHeight - 18) {
    doc.addPage();
    y = 20;
  }
  const right = pageWidth - margin;
  doc.setFontSize(8.5);
  doc.text(`For ${view.signatoryFor}`, right, y, { align: "right" });
  if (view.signature) {
    const props = doc.getImageProperties(view.signature);
    const h = 14;
    const w = Math.min(50, (props.width / props.height) * h);
    doc.addImage(view.signature, props.fileType, right - w, y + 3, w, h);
    y += h + 4;
  } else {
    y += 12;
  }
  doc.text("Authorised Signatory", right, y + 4, { align: "right" });

  // Page numbers
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(`Page ${page} of ${pages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    doc.setTextColor(20, 20, 20);
  }

  doc.save(fileName);
}
