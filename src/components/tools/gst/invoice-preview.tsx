"use client";

import * as React from "react";

import type { InvoiceView } from "@/lib/gst/view";

/** The sheet's natural width; it is scaled down to fit narrower columns. */
const SHEET_WIDTH = 680;

/**
 * On-screen preview: a white A4-like sheet built from the same view model as
 * the PDF and Excel file. Beside the form it is scaled to fit the column; on
 * phones, where scaling would make it unreadable, it scrolls sideways instead.
 */
export function InvoicePreview({ view }: { view: InvoiceView | null }) {
  const frame = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const hasView = view !== null;

  React.useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? SHEET_WIDTH;
      setZoom(width >= 440 && width < SHEET_WIDTH ? width / SHEET_WIDTH : 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasView]);

  if (!view) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-6 text-[0.9375rem] leading-relaxed text-muted">
        The preview appears here once the supplier GSTIN, place of supply and at least one complete item are filled in.
      </div>
    );
  }

  const th = "border border-neutral-300 bg-neutral-100 px-1.5 py-1 text-left font-semibold";
  const td = "border border-neutral-300 px-1.5 py-1 align-top";
  const num = `${td} text-right tabular-nums`;

  return (
    <div ref={frame} className="overflow-x-auto rounded-2xl" role="region" aria-label="Invoice preview" tabIndex={0}>
      <article
        style={{ width: SHEET_WIDTH, zoom }}
        className="bg-white p-6 text-[11px] leading-snug text-neutral-900 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
        <header className="relative mb-3 text-center">
          <h2 className="text-base font-bold tracking-wide text-neutral-900">{view.title}</h2>
          <p className="absolute right-0 top-0.5 text-[10px] text-neutral-600">{view.copyLabel}</p>
          {view.supplier.tradeName ? (
            <p className="mt-1 text-[15px] font-bold uppercase tracking-wide">{view.supplier.tradeName}</p>
          ) : null}
        </header>

        <table className="mb-2 w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Supplier</th>
              <th className={th}>Invoice details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>
                <p className="font-semibold">{view.supplier.name}</p>
                <p className="whitespace-pre-line">{view.supplier.address}</p>
                <p>GSTIN: {view.supplier.gstin}</p>
                <p>State: {view.supplier.state}</p>
                {view.supplier.phone ? <p>Phone: {view.supplier.phone}</p> : null}
              </td>
              <td className={td}>
                {view.details.map(([k, v]) => (
                  <p key={k}>
                    {k}: {v}
                  </p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mb-2 w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Bill to</th>
              {view.shipTo ? <th className={th}>Ship to</th> : null}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>
                <p className="font-semibold">{view.billTo.name}</p>
                <p className="whitespace-pre-line">{view.billTo.address}</p>
                <p>GSTIN: {view.billTo.gstin}</p>
                {view.billTo.state ? <p>State: {view.billTo.state}</p> : null}
                {view.billTo.phone ? <p>Phone: {view.billTo.phone}</p> : null}
              </td>
              {view.shipTo ? (
                <td className={td}>
                  <p className="font-semibold">{view.shipTo.name}</p>
                  <p className="whitespace-pre-line">{view.shipTo.address}</p>
                  {view.shipTo.state ? <p>State: {view.shipTo.state}</p> : null}
                </td>
              ) : null}
            </tr>
          </tbody>
        </table>

        <table className="mb-2 w-full border-collapse text-[10px]">
          <thead>
            <tr>
              {["#", "Description", "HSN/SAC", "Qty", "Unit", "Rate (₹)", "Disc.", "Taxable (₹)", "GST", "CGST (₹)", `${view.stateTaxLabel} (₹)`, "IGST (₹)", "Total (₹)"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.lines.map((l) => (
              <tr key={l.sno}>
                <td className={td}>{l.sno}</td>
                <td className={td}>
                  {l.description}
                  {l.kindLabel ? <span className="block text-neutral-500">({l.kindLabel})</span> : null}
                </td>
                <td className={td}>{l.hsn}</td>
                <td className={num}>{l.quantity}</td>
                <td className={td}>{l.unit}</td>
                <td className={num}>{l.rate}</td>
                <td className={num}>{l.discount}</td>
                <td className={num}>{l.taxable}</td>
                <td className={num}>{l.gstRate}</td>
                {[l.cgst, l.sgst, l.igst].map((t, i) => (
                  <td key={i} className={num}>
                    <span className="block text-neutral-500">{t.rate}</span>
                    {t.amount}
                  </td>
                ))}
                <td className={num}>{l.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <table className="w-1/2 border-collapse">
            <tbody>
              {view.totals.map(([k, v]) => (
                <tr key={k}>
                  <td className={td}>{k}</td>
                  <td className={num}>{v}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className={td}>Grand total</td>
                <td className={num}>₹{view.grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-2">
          <span className="font-semibold">Amount in words:</span> {view.words}
        </p>

        {view.bank.length || view.notes ? (
          <div className="mt-3 grid grid-cols-2 gap-4">
            {view.bank.length ? (
              <div>
                <p className="font-semibold">Bank details</p>
                {view.bank.map(([k, v]) => (
                  <p key={k}>
                    {k}: {v}
                  </p>
                ))}
              </div>
            ) : null}
            {view.notes ? (
              <div>
                <p className="font-semibold">Notes / terms</p>
                <p className="whitespace-pre-line">{view.notes}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {view.reverseChargeNote ? <p className="mt-3 font-semibold">{view.reverseChargeNote}</p> : null}

        {view.declaration ? (
          <p className="mt-3 text-[10px] leading-snug">
            <span className="font-semibold">Declaration:</span> {view.declaration}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-end text-right">
          <p>For {view.signatoryFor}</p>
          {view.signature ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data URL from the user's own upload
            <img src={view.signature} alt="Signature" className="my-1 h-12 w-auto max-w-[180px] object-contain" />
          ) : (
            <div className="h-10" />
          )}
          <p className="font-semibold">Authorised Signatory</p>
        </div>
      </article>
    </div>
  );
}
