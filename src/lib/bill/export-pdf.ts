import type { BillView } from "./bill";

/**
 * PDF for a simple bill or quotation, built in the browser. jsPDF and the
 * font load only when the user downloads. "a4" is a normal page; "receipt"
 * is an 80 mm strip for thermal printers, as long as the bill needs.
 */

type AutoTableDoc = { lastAutoTable: { finalY: number } };

async function fontBase64(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function createBillPdf(view: BillView, size: "a4" | "receipt"): Promise<Blob> {
  const [{ jsPDF }, { autoTable }, regular, semibold] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    fontBase64("/fonts/Geist-Regular.ttf"),
    fontBase64("/fonts/Geist-SemiBold.ttf"),
  ]);

  const receipt = size === "receipt";
  const width = receipt ? 80 : 210;
  const height = receipt ? 120 + view.lines.length * 12 + (view.notes ? 20 : 0) + (view.customer ? 18 : 0) : 297;
  const doc = new jsPDF({ unit: "mm", format: receipt ? [width, height] : "a4" });
  doc.addFileToVFS("Geist-Regular.ttf", regular);
  doc.addFont("Geist-Regular.ttf", "Geist", "normal");
  doc.addFileToVFS("Geist-SemiBold.ttf", semibold);
  doc.addFont("Geist-SemiBold.ttf", "Geist", "bold");

  const margin = receipt ? 4 : 14;
  const content = width - margin * 2;
  const fs = receipt ? 7.5 : 9.5;
  const lastY = () => (doc as unknown as AutoTableDoc).lastAutoTable.finalY;
  const grey: [number, number, number] = [200, 200, 200];
  const base = {
    theme: "grid" as const,
    margin: { left: margin, right: margin, bottom: 14 },
    styles: { font: "Geist", fontSize: fs, cellPadding: receipt ? 1 : 2, lineColor: grey, lineWidth: 0.2, textColor: [20, 20, 20] as [number, number, number] },
    headStyles: { font: "Geist", fontStyle: "bold" as const, fillColor: [240, 242, 245] as [number, number, number], textColor: [20, 20, 20] as [number, number, number] },
  };

  // Shop header
  let y = receipt ? 8 : 18;
  doc.setFont("Geist", "bold");
  doc.setFontSize(receipt ? 11 : 16);
  const shopLines = doc.splitTextToSize(view.shop.name, content);
  doc.text(shopLines, width / 2, y, { align: "center" });
  y += shopLines.length * (receipt ? 4.5 : 6.5);
  doc.setFont("Geist", "normal");
  doc.setFontSize(fs);
  for (const text of [view.shop.address, view.shop.phone ? `Phone: ${view.shop.phone}` : ""].filter(Boolean)) {
    const lines = doc.splitTextToSize(text, content);
    doc.text(lines, width / 2, y, { align: "center" });
    y += lines.length * (receipt ? 3.4 : 4.4);
  }
  y += 2;
  doc.setFont("Geist", "bold");
  doc.setFontSize(receipt ? 9 : 12);
  doc.text(view.title, width / 2, y, { align: "center" });
  doc.setFont("Geist", "normal");
  y += receipt ? 3 : 4;

  // Details and customer
  const left = view.details.map(([k, v]) => `${k}: ${v}`).join("\n");
  const customer = view.customer
    ? ["Customer", view.customer.name, view.customer.address, view.customer.phone ? `Phone: ${view.customer.phone}` : ""].filter(Boolean).join("\n")
    : "";
  autoTable(doc, {
    ...base,
    theme: "plain",
    startY: y,
    body: receipt ? [[left], ...(customer ? [[customer]] : [])] : [[left, customer]],
    columnStyles: receipt ? {} : { 0: { cellWidth: content / 2 }, 1: { cellWidth: content / 2 } },
  });

  // Items
  autoTable(doc, {
    ...base,
    startY: lastY() + 2,
    head: [receipt ? ["Item", "Qty", "Rate", "Amount"] : ["#", "Item", "Qty", "Unit", "Rate (₹)", "Disc.", "Amount (₹)"]],
    body: view.lines.map((l) =>
      receipt
        ? [l.discount !== "—" ? `${l.description} (−${l.discount})` : l.description, `${l.quantity} ${l.unit}`, l.rate, l.amount]
        : [String(l.sno), l.description, l.quantity, l.unit, l.rate, l.discount, l.amount],
    ),
    columnStyles: receipt
      ? { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } }
      : { 0: { cellWidth: 8 }, 2: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
  });

  // Totals and payment
  autoTable(doc, {
    ...base,
    startY: lastY() + 2,
    margin: { ...base.margin, left: receipt ? margin : margin + content * 0.5 },
    body: [...view.totals, ["Total", `₹${view.total}`], ...view.payment],
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (data: { row: { index: number }; cell: { styles: { fontStyle: string } } }) => {
      if (data.row.index === view.totals.length) data.cell.styles.fontStyle = "bold";
    },
  });

  y = lastY() + (receipt ? 4 : 6);
  doc.setFontSize(fs);
  const extra = [
    `Amount in words: ${view.words}`,
    view.taxNote ? `Taxes: ${view.taxNote}` : "",
    view.notes ? `Notes: ${view.notes}` : "",
  ].filter(Boolean);
  for (const text of extra) {
    const lines = doc.splitTextToSize(text, content);
    if (!receipt && y + lines.length * 4.4 > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * (receipt ? 3.4 : 4.4) + 1.5;
  }

  if (receipt) {
    y += 4;
    doc.text("Thank you!", width / 2, y, { align: "center" });
  } else {
    y += 14;
    if (y > 280) {
      doc.addPage();
      y = 30;
    }
    doc.text(`For ${view.signatoryFor}`, width - margin, y, { align: "right" });
    doc.text("Authorised Signatory", width - margin, y + 14, { align: "right" });
    const pages = doc.getNumberOfPages();
    for (let p = 1; p <= pages; p += 1) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setTextColor(110, 110, 110);
      doc.text(`Page ${p} of ${pages}`, width / 2, 290, { align: "center" });
      doc.setTextColor(20, 20, 20);
    }
  }

  return doc.output("blob");
}
