/** A4 PDF of a byaj hisaab: summary and ledger. Libraries load only on click. */

type AutoTableDoc = { lastAutoTable: { finalY: number } };

export type ByajPdf = {
  summary: [string, string][];
  ledgerHead: string[];
  ledger: string[][];
  notes: string[];
};

async function fontBase64(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function createByajPdf(data: ByajPdf): Promise<Blob> {
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
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const ink: [number, number, number] = [20, 20, 20];
  const base = {
    theme: "grid" as const,
    margin: { left: margin, right: margin, bottom: 16 },
    styles: { font: "Geist", fontSize: 8.5, cellPadding: 1.8, lineColor: [210, 210, 210] as [number, number, number], lineWidth: 0.2, textColor: ink },
    headStyles: { font: "Geist", fontStyle: "bold" as const, fillColor: [240, 242, 245] as [number, number, number], textColor: ink },
  };

  doc.setFont("Geist", "bold");
  doc.setFontSize(15);
  doc.text("Udhaar & byaj hisaab", margin, 18);
  autoTable(doc, { ...base, startY: 24, body: data.summary, columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } } });
  const right: Record<number, { halign: "right" }> = {};
  data.ledgerHead.forEach((_, i) => {
    if (i >= 2) right[i] = { halign: "right" };
  });
  autoTable(doc, {
    ...base,
    startY: (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 5,
    styles: { ...base.styles, fontSize: 7.5 },
    head: [data.ledgerHead],
    body: data.ledger,
    columnStyles: right,
  });
  let y = (doc as unknown as AutoTableDoc).lastAutoTable.finalY + 6;
  doc.setFont("Geist", "normal");
  doc.setFontSize(8);
  for (const note of data.notes) {
    const lines = doc.splitTextToSize(note, width);
    if (y + lines.length * 4 > doc.internal.pageSize.getHeight() - 16) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }
  return doc.output("blob");
}
