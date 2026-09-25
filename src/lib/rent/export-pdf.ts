import { formatPaise } from "../gst/money";
import { receipts, receiptText, stampNeeded, type RentDraft } from "./rent-receipt";

/** Three rent receipts per A4 page, each with a signature line and, for cash above ₹5,000, a revenue-stamp box. */

async function fontBase64(url: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function createRentPdf(draft: RentDraft): Promise<Blob> {
  const list = receipts(draft);
  if (!list) throw new Error("Invalid rent details");
  const [{ jsPDF }, regular, semibold] = await Promise.all([
    import("jspdf"),
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
  const slot = (doc.internal.pageSize.getHeight() - 20) / 3;
  const stamp = stampNeeded(draft);
  const pan = draft.landlordPan.trim().toUpperCase();

  list.forEach((receipt, index) => {
    if (index > 0 && index % 3 === 0) doc.addPage();
    const top = 10 + (index % 3) * slot;
    doc.setDrawColor(170, 170, 170);
    doc.setLineDashPattern([], 0);
    doc.roundedRect(margin, top, width, slot - 6, 2, 2);

    doc.setFont("Geist", "bold");
    doc.setFontSize(13);
    doc.text("RENT RECEIPT", margin + width / 2, top + 9, { align: "center" });
    doc.setFont("Geist", "normal");
    doc.setFontSize(9);
    doc.text(`Date: ${receipt.date}`, margin + width - 5, top + 9, { align: "right" });
    doc.text(`No. ${index + 1}`, margin + 5, top + 9);

    doc.setFontSize(10);
    const text = doc.splitTextToSize(receiptText(draft, receipt), width - 10);
    doc.text(text, margin + 5, top + 18, { lineHeightFactor: 1.5 });

    let y = top + 18 + text.length * 5.3 + 3;
    doc.setFontSize(9);
    doc.text(`Landlord: ${draft.landlord.trim()}`, margin + 5, y);
    y += 5;
    if (pan) {
      doc.text(`Landlord PAN: ${pan}`, margin + 5, y);
      y += 5;
    }
    if (draft.landlordAddress.trim()) {
      const address = doc.splitTextToSize(`Landlord address: ${draft.landlordAddress.trim()}`, width * 0.6);
      doc.text(address, margin + 5, y);
    }

    const bottom = top + slot - 12;
    if (stamp) {
      doc.setLineDashPattern([1, 1], 0);
      doc.rect(margin + width - 62, bottom - 20, 18, 20);
      doc.setFontSize(6.5);
      doc.text(["Revenue", "stamp ₹1"], margin + width - 53, bottom - 11, { align: "center" });
      doc.setLineDashPattern([], 0);
    }
    doc.setFontSize(9);
    doc.line(margin + width - 40, bottom - 2, margin + width - 5, bottom - 2);
    doc.text("Signature of landlord", margin + width - 22.5, bottom + 2, { align: "center" });
    doc.setFont("Geist", "bold");
    doc.setFontSize(11);
    doc.text(`₹${formatPaise(receipt.amount)}`, margin + 5, bottom);
    doc.setFont("Geist", "normal");
  });
  return doc.output("blob");
}
