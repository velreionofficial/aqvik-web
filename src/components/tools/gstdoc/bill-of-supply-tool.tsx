"use client";

import * as React from "react";
import Link from "next/link";

import { Checkbox, FormSection, TextArea, TextField, YesNo } from "@/components/tools/gst/fields";
import { ItemsEditor, newLine } from "@/components/tools/gst/items-editor";
import { BusinessFields } from "@/components/tools/gstdoc/business-fields";
import { DocActions, docFileName } from "@/components/tools/gstdoc/doc-actions";
import { DocPreview } from "@/components/tools/gstdoc/doc-preview";
import { useSavedBusiness, type Business } from "@/components/tools/gstdoc/saved-business";
import { bosCopy } from "@/content/gst-docs";
import { buildBosView, computeBos, validateBos, type BosDraft } from "@/lib/gstdoc/bill-of-supply";
import { cn } from "@/lib/utils";

export function emptyBos(): BosDraft {
  return {
    issuer: "",
    turnover: "upto5",
    supplier: { legalName: "", tradeName: "", address: "", gstin: "", phone: "" },
    number: "",
    date: "",
    recipient: { registered: false, name: "", address: "", gstin: "" },
    lines: [newLine("line-1")],
    roundOff: true,
    notes: "",
  };
}

export function BillOfSupplyTool({ initialDraft }: { initialDraft?: BosDraft }) {
  const [draft, setDraft] = React.useState<BosDraft>(() => initialDraft ?? emptyBos());
  const [attempted, setAttempted] = React.useState(false);
  const [who, setWho] = React.useState<string>(draft.issuer);
  const applySaved = React.useCallback((b: Business) => setDraft((d) => ({ ...d, supplier: { ...d.supplier, ...b } })), []);
  const saved = useSavedBusiness(applySaved);

  React.useEffect(() => setDraft((d) => (d.date ? d : { ...d, date: new Date().toLocaleDateString("en-CA") })), []);
  const { remember, save } = saved;
  React.useEffect(() => {
    if (remember) save(draft.supplier);
  }, [remember, save, draft.supplier]);

  const set = <K extends keyof BosDraft>(key: K, value: BosDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const choose = (value: string) => {
    setWho(value);
    set("issuer", value === "composition" || value === "exempt" ? value : "");
  };

  const errors = React.useMemo(() => validateBos(draft), [draft]);
  const result = React.useMemo(() => computeBos(draft), [draft]);
  const view = React.useMemo(
    () => (result && draft.issuer && draft.supplier.legalName.trim() ? buildBosView(draft, result) : null),
    [draft, result],
  );
  const errorFor = (key: string, value: string) => (attempted || value.trim() !== "" ? errors[key] : undefined);

  const make = async () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0 || !view) return null;
    const { createDocPdf } = await import("@/lib/gstdoc/export-pdf");
    return createDocPdf(view);
  };

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 sm:p-7">
        <fieldset>
          <legend className="text-[1.0625rem] font-semibold text-foreground">
            {bosCopy.question}
            <span className="mt-1 block text-[0.9375rem] font-normal text-muted">{bosCopy.questionHinglish}</span>
          </legend>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {bosCopy.options.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "cursor-pointer rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-primary",
                  who === o.value ? "border-primary bg-primary/15" : "border-white/10 hover:bg-white/5",
                )}
              >
                <input type="radio" name="bos-issuer" className="sr-only" checked={who === o.value} onChange={() => choose(o.value)} />
                <span className="block text-[0.9375rem] font-medium text-foreground">{o.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{o.hinglish}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {who === "none" ? (
          <div role="status" className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem] leading-relaxed">
            <p>{bosCopy.notRegistered}</p>
            <p className="mt-1 text-muted">{bosCopy.notRegisteredHinglish}</p>
            <Link href="/tools/bill-maker" className="mt-2 inline-block text-primary-soft underline underline-offset-4">
              Open the bill maker →
            </Link>
          </div>
        ) : null}
        {draft.issuer === "exempt" ? <p className="mt-4 text-sm leading-relaxed text-muted">{bosCopy.exemptNote}</p> : null}
      </div>

      {draft.issuer === "composition" || draft.issuer === "exempt" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Bill of Supply details">
            <FormSection title="Your business">
              <BusinessFields
                value={draft.supplier}
                onChange={(v) => set("supplier", v)}
                errorFor={errorFor}
                remember={saved.remember}
                onRemember={saved.setRemember}
                onForget={saved.forget}
              />
              {draft.issuer === "exempt" ? (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-foreground">Turnover in the previous financial year</legend>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["upto5", "Up to ₹5 crore"],
                        ["above5", "More than ₹5 crore"],
                      ] as const
                    ).map(([v, label]) => (
                      <label key={v} className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary", draft.turnover === v ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted")}>
                        <input type="radio" name="bos-turnover" className="sr-only" checked={draft.turnover === v} onChange={() => set("turnover", v)} />
                        {label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-dim">Decides whether HSN codes need 4 or 6 digits.</p>
                </fieldset>
              ) : null}
            </FormSection>

            <FormSection title="Bill of Supply">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="number" label="Bill number" maxLength={16} placeholder="e.g. BOS/26-27/001" value={draft.number} onChange={(v) => set("number", v)} error={errorFor("number", draft.number)} hint="Up to 16 characters: letters, numbers, - and /." />
                <TextField id="date" label="Date" type="date" value={draft.date} onChange={(v) => set("date", v)} error={errorFor("date", draft.date)} />
              </div>
            </FormSection>

            <FormSection title="Recipient">
              <YesNo name="recipient-registered" legend="Is the recipient registered under GST?" value={draft.recipient.registered} onChange={(v) => set("recipient", { ...draft.recipient, registered: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="recipient.name" label="Name" optional={!draft.recipient.registered} value={draft.recipient.name} onChange={(v) => set("recipient", { ...draft.recipient, name: v })} error={errorFor("recipient.name", draft.recipient.name)} />
                {draft.recipient.registered ? (
                  <TextField id="recipient.gstin" label="GSTIN" maxLength={15} value={draft.recipient.gstin} onChange={(v) => set("recipient", { ...draft.recipient, gstin: v.toUpperCase() })} error={errorFor("recipient.gstin", draft.recipient.gstin)} />
                ) : null}
              </div>
              <TextArea id="recipient.address" label="Address" optional={!draft.recipient.registered} rows={2} value={draft.recipient.address} onChange={(v) => set("recipient", { ...draft.recipient, address: v })} error={errorFor("recipient.address", draft.recipient.address)} />
            </FormSection>

            <FormSection title="Items">
              <ItemsEditor
                lines={draft.lines}
                onChange={(lines) => set("lines", lines)}
                errorFor={errorFor}
                intraState={true}
                showGstRate={false}
                hsnOptional={draft.turnover === "upto5" && !draft.recipient.registered}
              />
            </FormSection>

            <FormSection title="Totals and notes">
              <Checkbox id="roundOff" label="Round off to nearest rupee" checked={draft.roundOff} onChange={(v) => set("roundOff", v)} />
              <TextArea id="notes" label="Notes" optional value={draft.notes} onChange={(v) => set("notes", v)} />
            </FormSection>

            <DocActions make={make} fileName={docFileName(draft.number, draft.date, "bill-of-supply")} />
          </form>
          <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <h2 className="mb-3 text-sm font-medium text-muted">Live preview</h2>
            <DocPreview view={view} label="Bill of Supply preview" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
