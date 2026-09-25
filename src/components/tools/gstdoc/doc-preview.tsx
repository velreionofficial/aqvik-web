"use client";

import * as React from "react";

import type { DocView } from "@/lib/gstdoc/view";

const SHEET_WIDTH = 680;

/** On-screen copy of a Bill of Supply, challan or note, from the same view as the PDF. */
export function DocPreview({ view, label }: { view: DocView | null; label: string }) {
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
        The preview appears here once the details and at least one complete item are filled in.
      </div>
    );
  }

  const cell = "border border-neutral-300 px-1.5 py-1 align-top";
  return (
    <div ref={frame} className="overflow-x-auto rounded-2xl" role="region" aria-label={label} tabIndex={0}>
      <article style={{ width: SHEET_WIDTH, zoom }} className="bg-white p-6 text-[10.5px] leading-snug text-neutral-900">
        {view.topNote ? <p className="mb-1 text-center text-[11px] font-bold">{view.topNote}</p> : null}
        <div className="relative mb-1">
          <h2 className="text-center text-base font-bold text-neutral-900">{view.title}</h2>
          {view.copyLabel ? <p className="absolute right-0 top-1 text-[9px]">{view.copyLabel}</p> : null}
        </div>
        {view.issuer.tradeName ? <p className="mb-2 text-center text-[15px] font-bold">{view.issuer.tradeName}</p> : null}

        <table className="mb-2 w-full border-collapse">
          <thead>
            <tr>
              <th className={`${cell} w-[55%] bg-neutral-100 text-left`}>{view.issuer.heading}</th>
              <th className={`${cell} bg-neutral-100 text-left`}>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cell}>
                {view.issuer.lines.map((l) => (
                  <p key={l} className="whitespace-pre-line">
                    {l}
                  </p>
                ))}
              </td>
              <td className={cell}>
                {view.details.map(([k, v]) => (
                  <p key={k}>
                    {k}: {v}
                  </p>
                ))}
              </td>
            </tr>
          </tbody>
        </table>

        {view.parties.length ? (
          <table className="mb-2 w-full border-collapse">
            <thead>
              <tr>
                {view.parties.map((p) => (
                  <th key={p.heading} className={`${cell} bg-neutral-100 text-left`}>
                    {p.heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {view.parties.map((p) => (
                  <td key={p.heading} className={cell}>
                    {p.lines.map((l) => (
                      <p key={l} className="whitespace-pre-line">
                        {l}
                      </p>
                    ))}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        ) : null}

        <table className="mb-2 w-full border-collapse text-[9.5px]">
          <thead>
            <tr>
              {view.columns.map((c) => (
                <th key={c.label} className={`${cell} bg-neutral-100 ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row, i) => (
              <tr key={i}>
                {row.map((value, j) => (
                  <td key={j} className={`${cell} ${view.columns[j]?.align === "right" ? "text-right tabular-nums" : ""}`}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <table className="w-1/2 border-collapse">
            <tbody>
              {[...view.totals, view.grand].map(([k, v], i, all) => (
                <tr key={k} className={i === all.length - 1 ? "font-bold" : undefined}>
                  <td className={cell}>{k}</td>
                  <td className={`${cell} text-right tabular-nums`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {view.words ? (
          <p className="mt-2">
            <span className="font-semibold">Amount in words:</span> {view.words}
          </p>
        ) : null}
        {view.extras.map((e, i) => (
          <p key={i} className="mt-1 whitespace-pre-line">
            <span className="font-semibold">{e.label}:</span> {e.text}
          </p>
        ))}
        <div className="mt-6 flex flex-col items-end text-right">
          <p>For {view.signatoryFor}</p>
          <div className="h-8" />
          <p className="font-semibold">Authorised Signatory</p>
        </div>
      </article>
    </div>
  );
}
