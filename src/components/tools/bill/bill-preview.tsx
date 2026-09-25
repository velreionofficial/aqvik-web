"use client";

import * as React from "react";

import type { BillView } from "@/lib/bill/bill";

const SHEET_WIDTH = 600;

/** On-screen copy of the bill, built from the same view as the PDF. */
export function BillPreview({ view }: { view: BillView | null }) {
  const frame = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const hasView = view !== null;

  React.useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? SHEET_WIDTH;
      setZoom(width >= 420 && width < SHEET_WIDTH ? width / SHEET_WIDTH : 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasView]);

  if (!view) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-6 text-[0.9375rem] leading-relaxed text-muted">
        The preview appears here once your shop name and at least one complete item are filled in.
      </div>
    );
  }

  const th = "border border-neutral-300 bg-neutral-100 px-1.5 py-1 text-left font-semibold";
  const td = "border border-neutral-300 px-1.5 py-1 align-top";
  const num = `${td} text-right tabular-nums`;

  return (
    <div ref={frame} className="overflow-x-auto rounded-2xl" role="region" aria-label="Bill preview" tabIndex={0}>
      <article style={{ width: SHEET_WIDTH, zoom }} className="bg-white p-6 text-[11px] leading-snug text-neutral-900">
        <header className="mb-3 text-center">
          <h2 className="text-base font-bold text-neutral-900">{view.shop.name}</h2>
          {view.shop.address ? <p className="whitespace-pre-line">{view.shop.address}</p> : null}
          {view.shop.phone ? <p>Phone: {view.shop.phone}</p> : null}
          <p className="mt-2 text-sm font-bold tracking-wide">{view.title}</p>
        </header>

        <div className="mb-2 flex justify-between gap-4">
          <div>
            {view.details.map(([k, v]) => (
              <p key={k}>
                {k}: {v}
              </p>
            ))}
          </div>
          {view.customer ? (
            <div className="text-right">
              <p className="font-semibold">Customer</p>
              {view.customer.name ? <p>{view.customer.name}</p> : null}
              {view.customer.address ? <p className="whitespace-pre-line">{view.customer.address}</p> : null}
              {view.customer.phone ? <p>Phone: {view.customer.phone}</p> : null}
            </div>
          ) : null}
        </div>

        <table className="mb-2 w-full border-collapse">
          <thead>
            <tr>
              {["#", "Item", "Qty", "Unit", "Rate (₹)", "Disc.", "Amount (₹)"].map((h) => (
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
                <td className={td}>{l.description}</td>
                <td className={num}>{l.quantity}</td>
                <td className={td}>{l.unit}</td>
                <td className={num}>{l.rate}</td>
                <td className={num}>{l.discount}</td>
                <td className={num}>{l.amount}</td>
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
                <td className={td}>Total</td>
                <td className={num}>₹{view.total}</td>
              </tr>
              {view.payment.map(([k, v]) => (
                <tr key={k}>
                  <td className={td}>{k}</td>
                  <td className={num}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2">
          <span className="font-semibold">Amount in words:</span> {view.words}
        </p>
        {view.taxNote ? (
          <p className="mt-1">
            <span className="font-semibold">Taxes:</span> {view.taxNote}
          </p>
        ) : null}
        {view.notes ? (
          <p className="mt-1 whitespace-pre-line">
            <span className="font-semibold">Notes:</span> {view.notes}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-end text-right">
          <p>For {view.signatoryFor}</p>
          <div className="h-8" />
          <p className="font-semibold">Authorised Signatory</p>
        </div>
      </article>
    </div>
  );
}
