"use client";

import * as React from "react";

import { FormSection, SelectField, TextArea, TextField } from "@/components/tools/gst/fields";
import { DocActions } from "@/components/tools/gstdoc/doc-actions";
import { rentCopy } from "@/content/gst-docs";
import { formatPaise } from "@/lib/gst/money";
import { PAYMENT_MODES, panNeeded, receipts, receiptText, stampNeeded, validateRent, type RentDraft } from "@/lib/rent/rent-receipt";

/** Current financial year, April to March, as the default period. */
function financialYear(): Pick<RentDraft, "from" | "to"> {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${start}-04`, to: `${start + 1}-03` };
}

export function emptyRent(): RentDraft {
  return {
    tenant: "",
    landlord: "",
    landlordPan: "",
    landlordAddress: "",
    property: "",
    monthlyRent: "",
    from: "",
    to: "",
    mode: "Bank transfer",
    receiptDay: "last",
  };
}

export function RentReceiptTool({ initialDraft }: { initialDraft?: RentDraft }) {
  const [draft, setDraft] = React.useState<RentDraft>(() => initialDraft ?? emptyRent());
  const [attempted, setAttempted] = React.useState(false);
  React.useEffect(() => setDraft((d) => (d.from ? d : { ...d, ...financialYear() })), []);

  const set = <K extends keyof RentDraft>(key: K, value: RentDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const errors = React.useMemo(() => validateRent(draft), [draft]);
  const list = React.useMemo(() => receipts(draft), [draft]);
  const errorFor = (key: string, value: string) => (attempted || value.trim() !== "" ? errors[key] : undefined);
  const needPan = panNeeded(draft) && draft.landlordPan.trim() === "";
  const stamp = stampNeeded(draft);
  const first = list?.[0];

  const make = async () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0 || !list) return null;
    const { createRentPdf } = await import("@/lib/rent/export-pdf");
    return createRentPdf(draft);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Rent receipt details">
        <FormSection title="Tenant and landlord">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="tenant" label="Tenant name" value={draft.tenant} onChange={(v) => set("tenant", v)} error={errorFor("tenant", draft.tenant)} />
            <TextField id="landlord" label="Landlord name" value={draft.landlord} onChange={(v) => set("landlord", v)} error={errorFor("landlord", draft.landlord)} />
            <TextField id="landlordPan" label="Landlord PAN" optional={!panNeeded(draft)} maxLength={10} autoCapitalize="characters" value={draft.landlordPan} onChange={(v) => set("landlordPan", v.toUpperCase())} error={errorFor("landlordPan", draft.landlordPan)} />
          </div>
          {needPan ? (
            <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-relaxed">
              {rentCopy.panWarning}
              <span className="mt-1 block text-muted">{rentCopy.panWarningHinglish}</span>
            </p>
          ) : null}
          <TextArea id="landlordAddress" label="Landlord address" optional rows={2} value={draft.landlordAddress} onChange={(v) => set("landlordAddress", v)} />
        </FormSection>

        <FormSection title="Rent">
          <TextArea id="property" label="Address of the rented property" rows={2} value={draft.property} onChange={(v) => set("property", v)} error={errorFor("property", draft.property)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="monthlyRent" label="Monthly rent (₹)" inputMode="decimal" value={draft.monthlyRent} onChange={(v) => set("monthlyRent", v)} error={errorFor("monthlyRent", draft.monthlyRent)} />
            <SelectField id="mode" label="Paid by" value={draft.mode} onChange={(v) => set("mode", v as RentDraft["mode"])} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} />
            <TextField id="from" label="From month" type="month" value={draft.from} onChange={(v) => set("from", v)} error={errorFor("from", draft.from)} />
            <TextField id="to" label="To month" type="month" value={draft.to} onChange={(v) => set("to", v)} error={errorFor("to", draft.to)} />
          </div>
          <SelectField
            id="receiptDay"
            label="Date on each receipt"
            value={draft.receiptDay}
            onChange={(v) => set("receiptDay", v as RentDraft["receiptDay"])}
            options={[
              { value: "last", label: "Last day of the month" },
              { value: "first", label: "First day of the month" },
            ]}
          />
          {stamp ? (
            <p role="status" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed">
              {rentCopy.stampNote}
              <span className="mt-1 block text-muted">{rentCopy.stampNoteHinglish}</span>
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-dim">{rentCopy.hraNote}</p>
        </FormSection>

        <DocActions make={make} fileName={`rent-receipts_${draft.from || "period"}_to_${draft.to || "period"}.pdf`} />
      </form>

      <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <h2 className="mb-3 text-sm font-medium text-muted">Live preview</h2>
        {first && draft.tenant.trim() && draft.landlord.trim() && draft.property.trim() ? (
          <div className="rounded-2xl bg-white p-5 text-[0.875rem] leading-relaxed text-neutral-900">
            <div className="flex items-baseline justify-between">
              <span className="text-xs">No. 1</span>
              <h3 className="text-base font-bold text-neutral-900">RENT RECEIPT</h3>
              <span className="text-xs">Date: {first.date}</span>
            </div>
            <p className="mt-3">{receiptText(draft, first)}</p>
            <p className="mt-2 text-[0.8125rem]">Landlord: {draft.landlord.trim()}</p>
            {draft.landlordPan.trim() ? <p className="text-[0.8125rem]">Landlord PAN: {draft.landlordPan.trim()}</p> : null}
            <div className="mt-4 flex items-end justify-between">
              <span className="text-base font-bold">₹{formatPaise(first.amount)}</span>
              <div className="flex items-end gap-4">
                {stamp ? <span className="grid h-14 w-12 place-items-center border border-dashed border-neutral-400 text-center text-[9px]">Revenue stamp ₹1</span> : null}
                <span className="border-t border-neutral-500 pt-1 text-xs">Signature of landlord</span>
              </div>
            </div>
            <p className="mt-4 border-t border-neutral-200 pt-2 text-xs text-neutral-600">
              {list?.length} receipt{list?.length === 1 ? "" : "s"} in the PDF, {list?.[0]?.month} to {list?.[list.length - 1]?.month}, three per A4 page.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-[0.9375rem] leading-relaxed text-muted">
            The preview appears here once the names, address, rent and months are filled in.
          </div>
        )}
      </div>
    </div>
  );
}
