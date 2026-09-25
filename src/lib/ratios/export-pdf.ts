import type { RatioReport } from "./report";

/** A4 PDF of the inputs and results, built in the browser; libraries load on click. */

type AutoTableDoc = { lastAutoTable: { finalY: number } };

async function fontBase64(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function createRatioPdf(report: RatioReport): Promise<Blob> {
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
  const lastY = () => (doc as unknown as AutoTableDoc).lastAutoTable.finalY;
  const base = {
    theme: "grid" as const,
    margin: { left: margin, right: margin, bottom: 16 },
    styles: { font: "Geist", fontSize: 8.5, cellPadding: 1.8, lineColor: [210, 210, 210] as [number, number, number], lineWidth: 0.2, textColor: [20, 20, 20] as [number, number, number] },
    headStyles: { font: "Geist", fontStyle: "bold" as const, fillColor: [240, 242, 245] as [number, number, number], textColor: [20, 20, 20] as [number, number, number] },
  };

  doc.setFont("Geist", "bold");
  doc.setFontSize(15);
  doc.text(report.title, margin, 18);
  doc.setFont("Geist", "normal");
  doc.setFontSize(9);
  doc.text(`Amounts in ${report.unitLabel}. Figures entered by the user.`, margin, 24);

  let y = 28;
  const table = (head: string[], body: string[][], rightCols: number[] = []) => {
    const columnStyles: Record<number, { halign: "right" }> = {};
    for (const c of rightCols) columnStyles[c] = { halign: "right" };
    autoTable(doc, { ...base, startY: y, head: [head], body, columnStyles });
    y = lastY() + 5;
  };

  for (const section of report.inputs) table([section.section, "Entered"], section.rows, [1]);
  table(["Worked out", `Amount (${report.unitLabel})`, "Formula"], report.derived, [1]);
  for (const group of report.groups) table([group.title, "Result", "Formula"], group.rows, [1]);
  table(["DuPont breakdown", "Result"], report.dupont, [1]);

  doc.setFontSize(8);
  const note = doc.splitTextToSize(report.dupontNote, width);
  const disclaimer = doc.splitTextToSize(report.disclaimer, width);
  if (y + (note.length + disclaimer.length) * 4 + 6 > doc.internal.pageSize.getHeight() - 16) {
    doc.addPage();
    y = 20;
  }
  doc.text(note, margin, y);
  y += note.length * 4 + 3;
  doc.setFont("Geist", "bold");
  doc.text(disclaimer, margin, y);

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setFont("Geist", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(`AQVIK Financial Ratio Analyzer · Page ${p} of ${pages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    doc.setTextColor(20, 20, 20);
  }
  return doc.output("blob");
}
