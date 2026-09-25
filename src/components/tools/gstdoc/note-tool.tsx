"use client";

import * as React from "react";

import { Checkbox, FormSection, SelectField, TextArea, TextField, YesNo } from "@/components/tools/gst/fields";
import { ItemsEditor, newLine } from "@/components/tools/gst/items-editor";
import { BusinessFields } from "@/components/tools/gstdoc/business-fields";
import { DocActions, docFileName } from "@/components/tools/gstdoc/doc-actions";
import { DocPreview } from "@/components/tools/gstdoc/doc-preview";
import { useSavedBusiness, type Business } from "@/components/tools/gstdoc/saved-business";
import { noteCopy } from "@/content/gst-docs";
import { gstCopy } from "@/content/gst-invoice";
import { checkGstin } from "@/lib/gst/gstin";
import { GST_STATES } from "@/lib/gst/states";
import {
  NOTE_REASONS,
  buildNoteView,
  computeNote,
  creditNoteDeadline,
  lateInvoices,
  noteBlockReason,
  validateNote,
  type NoteDraft,
  type NoteType,
  type OriginalInvoice,
} from "@/lib/gstdoc/credit-debit-note";
import { displayDate } from "@/lib/gstdoc/lines";
import { cn } from "@/lib/utils";

const STATE_OPTIONS = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

export function emptyNote(): NoteDraft {
  return {
    type: "credit",
    turnover: "",
    eInvoiceExempt: false,
    sezOrExport: false,
    reverseCharge: false,
    supplier: { legalName: "", tradeName: "", address: "", gstin: "", phone: "" },
    number: "",
    date: "",
    originals: [{ id: "inv-1", number: "", date: "" }],
    reason: "",
    recipient: { registered: true, name: "", address: "", gstin: "", stateCode: "" },
    placeOfSupply: "",
    lines: [newLine("line-1")],
    notes: "",
  };
}

export function NoteTool({ initialDraft }: { initialDraft?: NoteDraft }) {
  const [draft, setDraft] = React.useState<NoteDraft>(() => initialDraft ?? emptyNote());
  const [attempted, setAttempted] = React.useState(false);
  const [otherReason, setOtherReason] = React.useState(false);
  const applySaved = React.useCallback((b: Business) => setDraft((d) => ({ ...d, supplier: { ...d.supplier, ...b } })), []);
  const saved = useSavedBusiness(applySaved);
  const { remember, save } = saved;

  React.useEffect(() => setDraft((d) => (d.date ? d : { ...d, date: new Date().toLocaleDateString("en-CA") })), []);
  React.useEffect(() => {
    if (remember) save(draft.supplier);
  }, [remember, save, draft.supplier]);

  const set = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  /**
   * The recipient's state pre-fills the place of supply only when the GSTIN,
   * state or registration changes, so a place of supply chosen by hand is
   * not overwritten while the name or address is typed.
   */
  const setRecipient = (patch: Partial<NoteDraft["recipient"]>) => {
    const next = { ...draft.recipient, ...patch };
    const stateChanged = "gstin" in patch || "stateCode" in patch || "registered" in patch;
    const check = checkGstin(next.gstin);
    const code = next.registered ? (check.ok ? check.stateCode : "") : next.stateCode;
    setDraft((d) => ({ ...d, recipient: next, placeOfSupply: stateChanged && code ? code : d.placeOfSupply }));
  };
  const setOriginal = (id: string, patch: Partial<OriginalInvoice>) =>
    set("originals", draft.originals.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const addOriginal = () =>
    set("originals", [...draft.originals, { id: Math.random().toString(36).slice(2, 10), number: "", date: "" }]);
  const removeOriginal = (id: string) => set("originals", draft.originals.filter((o) => o.id !== id));
  const setType = (type: NoteType) => {
    setOtherReason(false);
    setDraft((d) => ({ ...d, type, reason: "" }));
  };

  const block = noteBlockReason(draft);
  const errors = React.useMemo(() => validateNote(draft), [draft]);
  const result = React.useMemo(() => computeNote(draft), [draft]);
  const view = React.useMemo(() => (result && draft.supplier.legalName.trim() ? buildNoteView(draft, result) : null), [draft, result]);
  const errorFor = (key: string, value: string) => (attempted || value.trim() !== "" ? errors[key] : undefined);
  const noun = draft.type === "credit" ? "Credit note" : "Debit note";
  const late = lateInvoices(draft);

  const make = async () => {
    setAttempted(true);
    if (block || Object.keys(errors).length > 0 || !view) return null;
    const { createDocPdf } = await import("@/lib/gstdoc/export-pdf");
    return createDocPdf(view);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label={`${noun} details`}>
        <FormSection title="Type of note">
          <fieldset>
            <legend className="sr-only">Credit or debit note</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {noteCopy.types.map((t) => (
                <label key={t.value} className={cn("cursor-pointer rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-primary", draft.type === t.value ? "border-primary bg-primary/15" : "border-white/10 hover:bg-white/5")}>
                  <input type="radio" name="note-type" className="sr-only" checked={draft.type === t.value} onChange={() => setType(t.value)} />
                  <span className="block text-[0.9375rem] font-medium">{t.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{t.hinglish}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-xs leading-relaxed text-muted-dim">{noteCopy.whoCanIssue}</p>
        </FormSection>

        <FormSection title="Your business">
          <BusinessFields value={draft.supplier} onChange={(v) => set("supplier", v)} errorFor={errorFor} remember={remember} onRemember={saved.setRemember} onForget={saved.forget} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">{gstCopy.turnoverQuestion}</legend>
            <div className="flex flex-wrap gap-2">
              {gstCopy.turnoverOptions.map((o) => (
                <label key={o.value} className={cn("cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary", draft.turnover === o.value ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted")}>
                  <input type="radio" name="turnover" className="sr-only" checked={draft.turnover === o.value} onChange={() => set("turnover", o.value as NoteDraft["turnover"])} />
                  {o.label}
                </label>
              ))}
            </div>
            {attempted && errors.turnover ? <p className="mt-1.5 text-sm text-warning">{errors.turnover}</p> : null}
          </fieldset>
          <Checkbox id="sezOrExport" label="The original invoice was to an SEZ unit or an export" checked={draft.sezOrExport} onChange={(v) => set("sezOrExport", v)} />
          {draft.turnover === "5to500" ? (
            <Checkbox id="eInvoiceExempt" label="My business is exempt from e-invoicing" checked={draft.eInvoiceExempt} onChange={(v) => set("eInvoiceExempt", v)} />
          ) : null}
          {block ? (
            <p role="alert" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem]">
              {block}
            </p>
          ) : null}
        </FormSection>

        {!block ? (
          <>
            <FormSection title={noun}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="number" label={`${noun} number`} maxLength={16} placeholder={draft.type === "credit" ? "e.g. CN/26-27/001" : "e.g. DN/26-27/001"} value={draft.number} onChange={(v) => set("number", v)} error={errorFor("number", draft.number)} hint="Up to 16 characters: letters, numbers, - and /." />
                <TextField id="date" label="Date" type="date" value={draft.date} onChange={(v) => set("date", v)} error={errorFor("date", draft.date)} />
              </div>
              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-medium text-foreground">Original invoice{draft.originals.length > 1 ? "s" : ""}</legend>
                {draft.originals.map((o, i) => (
                  <div key={o.id} className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <TextField id={`originals.${o.id}.number`} label={`Invoice number${draft.originals.length > 1 ? ` ${i + 1}` : ""}`} value={o.number} onChange={(v) => setOriginal(o.id, { number: v })} error={errorFor(`originals.${o.id}.number`, o.number)} />
                    <TextField id={`originals.${o.id}.date`} label="Invoice date" type="date" value={o.date} onChange={(v) => setOriginal(o.id, { date: v })} error={errorFor(`originals.${o.id}.date`, o.date)} />
                    {draft.originals.length > 1 ? (
                      <button type="button" onClick={() => removeOriginal(o.id)} className="mt-7 rounded-md px-2 py-2 text-sm text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                <button type="button" onClick={addOriginal} className="rounded-md px-2 py-1 text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  + Add another invoice
                </button>
                <p className="text-xs leading-relaxed text-muted-dim">{noteCopy.multipleHint}</p>
              </fieldset>
              {late.length ? (
                <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-relaxed">
                  {late.map((o) => `${o.number.trim() || "Invoice"}: deadline ${displayDate(creditNoteDeadline(o.date) ?? "")}`).join(" · ")}. {noteCopy.lateWarning}
                </p>
              ) : null}
              <Checkbox id="reverseCharge" label="The original invoice was under reverse charge" checked={draft.reverseCharge} onChange={(v) => set("reverseCharge", v)} hint={noteCopy.reverseChargeHint} />
              <SelectField
                id="reason"
                label="Reason"
                value={otherReason ? "other" : draft.reason}
                onChange={(v) => {
                  setOtherReason(v === "other");
                  set("reason", v === "other" ? "" : v);
                }}
                options={[...NOTE_REASONS[draft.type].map((r) => ({ value: r, label: r })), { value: "other", label: "Other (write it)" }]}
                placeholder="Choose a reason"
                error={attempted && !otherReason ? errors.reason : undefined}
              />
              {otherReason ? <TextField id="reason-other" label="Reason" value={draft.reason} onChange={(v) => set("reason", v)} error={attempted ? errors.reason : undefined} /> : null}
              <p className="text-xs leading-relaxed text-muted-dim">{draft.type === "credit" ? noteCopy.timeLimit : noteCopy.debitTiming}</p>
            </FormSection>

            <FormSection title="Recipient">
              <YesNo name="recipient-registered" legend="Is the recipient registered under GST?" value={draft.recipient.registered} onChange={(v) => setRecipient({ registered: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="recipient.name" label="Name" value={draft.recipient.name} onChange={(v) => setRecipient({ name: v })} error={errorFor("recipient.name", draft.recipient.name)} />
                {draft.recipient.registered ? (
                  <TextField id="recipient.gstin" label="GSTIN" maxLength={15} value={draft.recipient.gstin} onChange={(v) => setRecipient({ gstin: v.toUpperCase() })} error={errorFor("recipient.gstin", draft.recipient.gstin)} />
                ) : (
                  <SelectField id="recipient.stateCode" label="State" value={draft.recipient.stateCode} onChange={(v) => setRecipient({ stateCode: v })} options={STATE_OPTIONS} placeholder="Choose a state" error={attempted ? errors["recipient.stateCode"] : undefined} />
                )}
              </div>
              <TextArea id="recipient.address" label={draft.recipient.registered ? "Address" : "Address (and delivery address)"} rows={2} value={draft.recipient.address} onChange={(v) => setRecipient({ address: v })} error={errorFor("recipient.address", draft.recipient.address)} />
              <SelectField id="placeOfSupply" label="Place of supply" value={draft.placeOfSupply} onChange={(v) => set("placeOfSupply", v)} options={STATE_OPTIONS} placeholder="Same as on the original invoice" error={attempted ? errors.placeOfSupply : undefined} hint="Use the same place of supply as the original invoice." />
            </FormSection>

            <FormSection title="Items being credited or debited">
              <p className="text-sm leading-relaxed text-muted">{noteCopy.itemsHint}</p>
              <ItemsEditor
                lines={draft.lines}
                onChange={(lines) => set("lines", lines)}
                errorFor={errorFor}
                intraState={result ? result.intraState : null}
                hsnOptional={draft.turnover === "upto5" && !draft.recipient.registered}
              />
            </FormSection>

            <FormSection title="Notes">
              <TextArea id="notes" label="Notes" optional value={draft.notes} onChange={(v) => set("notes", v)} />
            </FormSection>

            <DocActions make={make} fileName={docFileName(draft.number, draft.date, draft.type === "credit" ? "credit-note" : "debit-note")} />
          </>
        ) : null}
      </form>
      <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <h2 className="mb-3 text-sm font-medium text-muted">Live preview</h2>
        <DocPreview view={block ? null : view} label={`${noun} preview`} />
      </div>
    </div>
  );
}
