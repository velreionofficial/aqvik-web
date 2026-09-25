import type { DocView } from "./view";

/**
 * A4 PDF for any DocView, built in the browser. jsPDF, jspdf-autotable and
 * the Geist font (for the rupee sign) load only when the user downloads.
 */

type AutoTableDoc = { lastAutoTable: { finalY: number } };

async function fontBase64(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function createDocPdf(view: DocView): Promise<Blob> {
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

  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const content = pageWidth - margin * 2;
  const lastY = () => (doc as unknown as AutoTableDoc).lastAutoTable.finalY;
  const ink: [number, number, number] = [20, 20, 20];
  const base = {
    theme: "grid" as const,
    margin: { left: margin, right: margin, bottom: 18 },
    styles: { font: "Geist", fontSize: 8.5, cellPadding: 2, lineColor: [200, 200, 200] as [number, number, number], lineWidth: 0.2, textColor: ink },
    headStyles: { font: "Geist", fontStyle: "bold" as const, fillColor: [240, 242, 245] as [number, number, number], textColor: ink },
  };

  let y = 12;
  if (view.topNote) {
    doc.setFont("Geist", "bold");
    doc.setFontSize(9);
    const note = doc.splitTextToSize(view.topNote, content);
    doc.text(note, pageWidth / 2, y, { align: "center" });
    y += note.length * 4 + 2;
  }
  doc.setFont("Geist", "bold");
  doc.setFontSize(15);
  doc.text(view.title, pageWidth / 2, y + 4, { align: "center" });
  doc.setFont("Geist", "normal");
  if (view.copyLabel) {
    doc.setFontSize(8);
    doc.text(view.copyLabel, pageWidth - margin, y + 4, { align: "right" });
  }
  y += 8;
  if (view.issuer.tradeName) {
    doc.setFont("Geist", "bold");
    doc.setFontSize(13);
    const trade = doc.splitTextToSize(view.issuer.tradeName, content);
    doc.text(trade, pageWidth / 2, y + 3, { align: "center" });
    doc.setFont("Geist", "normal");
    y += trade.length * 5.5 + 1;
  }

  autoTable(doc, {
    ...base,
    startY: y + 1,
    head: [[view.issuer.heading, "Details"]],
    body: [[view.issuer.lines.join("\n"), view.details.map(([k, v]) => `${k}: ${v}`).join("\n")]],
    columnStyles: { 0: { cellWidth: content * 0.55 }, 1: { cellWidth: content * 0.45 } },
  });

  if (view.parties.length) {
    autoTable(doc, {
      ...base,
      startY: lastY() + 3,
      head: [view.parties.map((p) => p.heading)],
      body: [view.parties.map((p) => p.lines.join("\n"))],
    });
  }

  const columnStyles: Record<number, { halign: "right" }> = {};
  view.columns.forEach((c, i) => {
    if (c.align === "right") columnStyles[i] = { halign: "right" };
  });
  autoTable(doc, {
    ...base,
    startY: lastY() + 3,
    styles: { ...base.styles, fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { ...base.headStyles, fontSize: 7.5 },
    head: [view.columns.map((c) => c.label)],
    body: view.rows,
    columnStyles,
  });

  autoTable(doc, {
    ...base,
    startY: lastY() + 3,
    margin: { ...base.margin, left: margin + content * 0.5 },
    body: [...view.totals, view.grand],
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (data: { row: { index: number }; cell: { styles: { fontStyle: string } } }) => {
      if (data.row.index === view.totals.length) data.cell.styles.fontStyle = "bold";
    },
  });

  y = lastY() + 6;
  doc.setFontSize(8.5);
  const blocks = [view.words ? `Amount in words: ${view.words}` : "", ...view.extras.map((e) => `${e.label}: ${e.text}`)].filter(Boolean);
  for (const text of blocks) {
    const wrapped = doc.splitTextToSize(text, content);
    if (y + wrapped.length * 4 > pageHeight - 24) {
      doc.addPage();
      y = 20;
    }
    doc.text(wrapped, margin, y);
    y += wrapped.length * 4 + 2;
  }

  y += 10;
  if (y + 20 > pageHeight - 18) {
    doc.addPage();
    y = 24;
  }
  doc.text(`For ${view.signatoryFor}`, pageWidth - margin, y, { align: "right" });
  doc.text("Authorised Signatory", pageWidth - margin, y + 14, { align: "right" });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(`Page ${p} of ${pages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    doc.setTextColor(...ink);
  }
  return doc.output("blob");
}
