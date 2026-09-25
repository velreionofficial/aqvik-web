"use client";

import * as React from "react";

import { Checkbox, FormSection, SelectField, TextArea, TextField, YesNo } from "@/components/tools/gst/fields";
import { ItemsEditor, newLine } from "@/components/tools/gst/items-editor";
import { DocActions, docFileName } from "@/components/tools/gstdoc/doc-actions";
import { DocPreview } from "@/components/tools/gstdoc/doc-preview";
import { challanCopy } from "@/content/gst-docs";
import {
  CHALLAN_COPIES,
  CHALLAN_PURPOSES,
  buildChallanView,
  computeChallan,
  isSupplyPurpose,
  validateChallan,
  type ChallanDraft,
} from "@/lib/gstdoc/delivery-challan";
import { GST_STATES } from "@/lib/gst/states";

const STATE_OPTIONS = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));
type PartyKey = "consigner" | "consignee";

export function emptyChallan(): ChallanDraft {
  return {
    purpose: "",
    copy: "ORIGINAL FOR CONSIGNEE",
    consigner: { registered: true, name: "", address: "", gstin: "", stateCode: "" },
    consignee: { registered: false, name: "", address: "", gstin: "", stateCode: "" },
    number: "",
    date: "",
    provisionalQuantity: false,
    lines: [newLine("line-1")],
    transport: { vehicle: "", transporter: "", eWayBill: "" },
    notes: "",
  };
}

export function DeliveryChallanTool({ initialDraft }: { initialDraft?: ChallanDraft }) {
  const [draft, setDraft] = React.useState<ChallanDraft>(() => initialDraft ?? emptyChallan());
  const [attempted, setAttempted] = React.useState(false);
  React.useEffect(() => setDraft((d) => (d.date ? d : { ...d, date: new Date().toLocaleDateString("en-CA") })), []);

  const set = <K extends keyof ChallanDraft>(key: K, value: ChallanDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setParty = (who: PartyKey, patch: Partial<ChallanDraft[PartyKey]>) => set(who, { ...draft[who], ...patch });
  const errors = React.useMemo(() => validateChallan(draft), [draft]);
  const result = React.useMemo(() => computeChallan(draft), [draft]);
  const view = React.useMemo(() => (result && draft.purpose && draft.consigner.name.trim() ? buildChallanView(draft, result) : null), [draft, result]);
  const errorFor = (key: string, value: string) => (attempted || value.trim() !== "" ? errors[key] : undefined);
  const withTax = isSupplyPurpose(draft.purpose);

  const make = async () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0 || !view) return null;
    const { createDocPdf } = await import("@/lib/gstdoc/export-pdf");
    return createDocPdf(view);
  };

  const partyFields = (who: PartyKey, title: string) => {
    const p = draft[who];
    return (
      <FormSection title={title}>
        <YesNo name={`${who}-registered`} legend={`Is the ${who} registered under GST?`} value={p.registered} onChange={(v) => setParty(who, { registered: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id={`${who}.name`} label="Name" value={p.name} onChange={(v) => setParty(who, { name: v })} error={errorFor(`${who}.name`, p.name)} />
          {p.registered ? (
            <TextField id={`${who}.gstin`} label="GSTIN" maxLength={15} value={p.gstin} onChange={(v) => setParty(who, { gstin: v.toUpperCase() })} error={errorFor(`${who}.gstin`, p.gstin)} hint="The state is read from the GSTIN." />
          ) : (
            <SelectField id={`${who}.stateCode`} label="State" value={p.stateCode} onChange={(v) => setParty(who, { stateCode: v })} options={STATE_OPTIONS} placeholder="Choose a state" error={attempted ? errors[`${who}.stateCode`] : undefined} />
          )}
        </div>
        <TextArea id={`${who}.address`} label="Address" rows={2} value={p.address} onChange={(v) => setParty(who, { address: v })} error={errorFor(`${who}.address`, p.address)} />
      </FormSection>
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Delivery challan details">
        <FormSection title="Why are the goods moving?">
          <fieldset>
            <legend className="sr-only">Purpose</legend>
            <div className="space-y-2">
              {CHALLAN_PURPOSES.map((p) => (
                <label key={p.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 px-4 py-3 text-[0.9375rem] hover:bg-white/5 has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input type="radio" name="purpose" className="mt-1 accent-[#22D3EE]" checked={draft.purpose === p.value} onChange={() => set("purpose", p.value)} />
                  <span>
                    {p.label}
                    <span className="mt-0.5 block text-sm text-muted">{challanCopy.purposeHinglish[p.value]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {attempted && errors.purpose ? <p className="text-sm text-warning">{errors.purpose}</p> : null}
          {draft.purpose ? <p className="text-xs leading-relaxed text-muted-dim">{withTax ? challanCopy.taxShown : challanCopy.taxHidden}</p> : null}
        </FormSection>

        {partyFields("consigner", "Consigner (sender)")}
        {partyFields("consignee", "Consignee (receiver)")}

        <FormSection title="Challan">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="number" label="Challan number" maxLength={16} placeholder="e.g. DC/26-27/001" value={draft.number} onChange={(v) => set("number", v)} error={errorFor("number", draft.number)} hint="Up to 16 characters: letters, numbers, - and /." />
            <TextField id="date" label="Date" type="date" value={draft.date} onChange={(v) => set("date", v)} error={errorFor("date", draft.date)} />
          </div>
          <SelectField id="copy" label="Copy" value={draft.copy} onChange={(v) => set("copy", v as ChallanDraft["copy"])} options={CHALLAN_COPIES.map((c) => ({ value: c, label: c }))} hint={challanCopy.copyHint} />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField id="vehicle" label="Vehicle number" optional value={draft.transport.vehicle} onChange={(v) => set("transport", { ...draft.transport, vehicle: v })} />
            <TextField id="transporter" label="Transporter" optional value={draft.transport.transporter} onChange={(v) => set("transport", { ...draft.transport, transporter: v })} />
            <TextField id="eWayBill" label="E-way bill number" optional inputMode="numeric" value={draft.transport.eWayBill} onChange={(v) => set("transport", { ...draft.transport, eWayBill: v })} />
          </div>
          <p className="text-xs leading-relaxed text-muted-dim">{challanCopy.eWayNote}</p>
        </FormSection>

        <FormSection title="Goods">
          <Checkbox id="provisional" label="Quantity is provisional (exact quantity not known at removal)" checked={draft.provisionalQuantity} onChange={(v) => set("provisionalQuantity", v)} />
          <ItemsEditor
            lines={draft.lines}
            onChange={(lines) => set("lines", lines.map((l) => (l.kind === "goods" ? l : { ...l, kind: "goods" as const })))}
            errorFor={errorFor}
            intraState={result ? result.intraState : null}
            showGstRate={withTax}
            goodsOnly
          />
        </FormSection>

        <FormSection title="Notes">
          <TextArea id="notes" label="Notes" optional value={draft.notes} onChange={(v) => set("notes", v)} />
        </FormSection>

        <DocActions make={make} fileName={docFileName(draft.number, draft.date, "delivery-challan")} />
      </form>
      <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
        <h2 className="mb-3 text-sm font-medium text-muted">Live preview</h2>
        <DocPreview view={view} label="Delivery challan preview" />
      </div>
    </div>
  );
}
