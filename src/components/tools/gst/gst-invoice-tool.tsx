"use client";

import * as React from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Checkbox,
  FormSection,
  SelectField,
  TextArea,
  TextField,
  YesNo,
} from "@/components/tools/gst/fields";
import { InvoicePreview } from "@/components/tools/gst/invoice-preview";
import { ItemsEditor, newLine } from "@/components/tools/gst/items-editor";
import { gstCopy } from "@/content/gst-invoice";
import { checkGstin } from "@/lib/gst/gstin";
import {
  COPY_LABELS,
  UNREGISTERED_DETAILS_THRESHOLD,
  blockReason,
  computeInvoice,
  validateInvoice,
  type InvoiceDraft,
} from "@/lib/gst/invoice";
import { invoiceFileName } from "@/lib/gst/invoice-number";
import { GST_STATES, stateLabel } from "@/lib/gst/states";
import { buildInvoiceView } from "@/lib/gst/view";

const STORAGE_KEY = "aqvik-gst-business-v1";
const STATE_OPTIONS = GST_STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }));

export function emptyDraft(): InvoiceDraft {
  return {
    copyLabel: "Original for Recipient",
    supplier: { legalName: "", tradeName: "", address: "", gstin: "", phone: "" },
    invoiceNumber: "",
    invoiceDate: "",
    recipient: { registered: true, name: "", address: "", gstin: "", stateCode: "", phone: "" },
    placeOfSupply: "",
    shipToDifferent: false,
    shipTo: { name: "", address: "", stateCode: "" },
    reverseCharge: false,
    sezOrExport: false,
    turnover: "",
    eInvoiceExempt: false,
    transport: { orderNumber: "", vehicleNumber: "", eWayBill: "", transporter: "", from: "", to: "" },
    lines: [newLine("line-1")],
    roundOff: true,
    bank: { accountName: "", bankName: "", accountNumber: "", ifsc: "" },
    notes: "",
    signature: null,
  };
}

type Saved = Pick<InvoiceDraft, "supplier" | "bank"> & Partial<Pick<InvoiceDraft, "turnover" | "eInvoiceExempt">>;

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

/**
 * The whole GST invoice tool. Everything stays in this component's state; the
 * only storage is the opt-in "remember my business details" in localStorage.
 */
export function GstInvoiceTool({
  initialDraft,
  initialRegistered = null,
}: {
  /** Used only to render a filled example (e.g. for screenshots). */
  initialDraft?: InvoiceDraft;
  initialRegistered?: boolean | null;
}) {
  const [registered, setRegistered] = React.useState<boolean | null>(initialRegistered);
  const [draft, setDraft] = React.useState<InvoiceDraft>(() => initialDraft ?? emptyDraft());
  const [remember, setRemember] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);
  const [busy, setBusy] = React.useState<"pdf" | "xlsx" | null>(null);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  // Today's date and any saved business details are read in the browser only.
  React.useEffect(() => {
    setDraft((d) => (d.invoiceDate ? d : { ...d, invoiceDate: new Date().toLocaleDateString("en-CA") }));
    const saved = readSaved();
    if (saved) {
      setRemember(true);
      // Older saves may lack newer fields, so merge over the current values.
      setDraft((d) => ({
        ...d,
        supplier: { ...d.supplier, ...saved.supplier },
        bank: { ...d.bank, ...saved.bank },
        turnover: saved.turnover ?? d.turnover,
        eInvoiceExempt: saved.eInvoiceExempt ?? d.eInvoiceExempt,
      }));
    }
  }, []);

  React.useEffect(() => {
    if (!remember) return;
    try {
      const saved: Saved = {
        supplier: draft.supplier,
        bank: draft.bank,
        turnover: draft.turnover,
        eInvoiceExempt: draft.eInvoiceExempt,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      /* storage unavailable: nothing to do */
    }
  }, [remember, draft.supplier, draft.bank, draft.turnover, draft.eInvoiceExempt]);

  const forget = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setRemember(false);
  };

  const set = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const supplierCheck = checkGstin(draft.supplier.gstin);
  const supplierState = supplierCheck.ok ? supplierCheck.stateCode : "";
  const recipientCheck = draft.recipient.registered ? checkGstin(draft.recipient.gstin) : null;

  const errors = React.useMemo(() => validateInvoice(draft), [draft]);
  const computed = React.useMemo(
    () => computeInvoice(draft.lines, supplierState, draft.placeOfSupply, draft.roundOff, draft.reverseCharge),
    [draft.lines, supplierState, draft.placeOfSupply, draft.roundOff, draft.reverseCharge],
  );
  const view = React.useMemo(() => (computed ? buildInvoiceView(draft, computed) : null), [draft, computed]);
  const hasErrors = Object.keys(errors).length > 0;
  const block = blockReason(draft);
  const needsUnregisteredDetails =
    !draft.recipient.registered && computed !== null && computed.taxable >= UNREGISTERED_DETAILS_THRESHOLD;

  /** Show an error once the user has typed in the field, or after a download attempt. */
  const errorFor = (key: string, value: string) => (attempted || value.trim() !== "" ? errors[key] : undefined);

  const download = async (kind: "pdf" | "xlsx") => {
    setAttempted(true);
    setDownloadError(null);
    if (block || hasErrors || !view) return;
    setBusy(kind);
    try {
      const fileName = invoiceFileName(draft.invoiceNumber, draft.invoiceDate, kind);
      if (kind === "pdf") {
        const { downloadInvoicePdf } = await import("@/lib/gst/export-pdf");
        await downloadInvoicePdf(view, fileName);
      } else {
        const { downloadInvoiceXlsx } = await import("@/lib/gst/export-xlsx");
        await downloadInvoiceXlsx(view, fileName);
      }
    } catch {
      setDownloadError("The file could not be created. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const onSignature = (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 1024 * 1024) {
      setDownloadError("Signature must be a PNG or JPEG image under 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("signature", typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const gate = (
    <div className="glass rounded-2xl p-5 sm:p-7">
      <YesNo
        name="gst-registered"
        legend={gstCopy.registeredQuestion}
        value={registered}
        onChange={setRegistered}
        yes={gstCopy.registeredYes}
        no={gstCopy.registeredNo}
      />
      {registered === false ? (
        <p role="status" className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem] text-foreground">
          {gstCopy.notEligible}{" "}
          <Link href="/tools/bill-of-supply" className="text-primary-soft underline underline-offset-4">
            Bill of Supply maker
          </Link>{" "}
          ·{" "}
          <Link href="/tools/bill-maker" className="text-primary-soft underline underline-offset-4">
            Simple bill maker
          </Link>
        </p>
      ) : null}
    </div>
  );

  if (registered !== true) return gate;

  return (
    <div className="space-y-4">
      {gate}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Invoice details">
          <FormSection title="Your business (supplier)">
            <TextField
              id="supplier.legalName"
              label="Legal name"
              value={draft.supplier.legalName}
              onChange={(v) => set("supplier", { ...draft.supplier, legalName: v })}
              error={errorFor("supplier.legalName", draft.supplier.legalName)}
              hint="As registered under GST."
            />
            <TextField
              id="supplier.tradeName"
              label="Trade name / company name"
              optional
              value={draft.supplier.tradeName}
              onChange={(v) => set("supplier", { ...draft.supplier, tradeName: v })}
              hint="Shown large at the top of the invoice, for example your shop or company name."
            />
            <TextArea
              id="supplier.address"
              label="Address"
              value={draft.supplier.address}
              onChange={(v) => set("supplier", { ...draft.supplier, address: v })}
              error={errorFor("supplier.address", draft.supplier.address)}
            />
            <TextField
              id="supplier.gstin"
              label="GSTIN"
              autoCapitalize="characters"
              maxLength={15}
              value={draft.supplier.gstin}
              onChange={(v) => set("supplier", { ...draft.supplier, gstin: v.toUpperCase() })}
              error={errorFor("supplier.gstin", draft.supplier.gstin)}
              hint={supplierCheck.ok ? `State: ${stateLabel(supplierCheck.stateCode)}` : undefined}
            />
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">{gstCopy.turnoverQuestion}</legend>
              <div className="flex flex-wrap gap-2">
                {gstCopy.turnoverOptions.map((option) => (
                  <label
                    key={option.value}
                    className={
                      draft.turnover === option.value
                        ? "cursor-pointer rounded-full border border-primary bg-primary px-4 py-2 text-sm text-primary-foreground focus-within:ring-2 focus-within:ring-primary"
                        : "cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-muted hover:text-foreground focus-within:ring-2 focus-within:ring-primary"
                    }
                  >
                    <input
                      type="radio"
                      name="turnover"
                      checked={draft.turnover === option.value}
                      onChange={() => set("turnover", option.value as InvoiceDraft["turnover"])}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-dim">{gstCopy.turnoverHint}</p>
              {attempted && errors.turnover ? <p className="mt-1.5 text-sm text-warning">{errors.turnover}</p> : null}
            </fieldset>
            {draft.turnover === "5to500" ? (
              <Checkbox
                id="eInvoiceExempt"
                label={gstCopy.exemptLabel}
                checked={draft.eInvoiceExempt}
                onChange={(v) => set("eInvoiceExempt", v)}
                hint={gstCopy.exemptHint}
              />
            ) : null}
            <TextField
              id="supplier.phone"
              label="Phone"
              optional
              type="tel"
              inputMode="tel"
              value={draft.supplier.phone}
              onChange={(v) => set("supplier", { ...draft.supplier, phone: v })}
              error={errorFor("supplier.phone", draft.supplier.phone)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Checkbox
                id="remember"
                label={gstCopy.rememberLabel}
                checked={remember}
                onChange={(v) => (v ? setRemember(true) : forget())}
                hint={gstCopy.rememberHint}
              />
              <button
                type="button"
                onClick={forget}
                className="rounded-md px-2 py-1 text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {gstCopy.forget}
              </button>
            </div>
          </FormSection>

          <FormSection title="Invoice">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="invoiceNumber"
                label="Invoice number"
                maxLength={16}
                placeholder={gstCopy.invoiceNumberSuggestion}
                value={draft.invoiceNumber}
                onChange={(v) => set("invoiceNumber", v)}
                error={errorFor("invoiceNumber", draft.invoiceNumber)}
              />
              <TextField
                id="invoiceDate"
                label="Invoice date"
                type="date"
                value={draft.invoiceDate}
                onChange={(v) => set("invoiceDate", v)}
                error={errorFor("invoiceDate", draft.invoiceDate)}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-dim">{gstCopy.invoiceNumberNote}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="placeOfSupply"
                label="Place of supply"
                placeholder="Choose state or UT"
                value={draft.placeOfSupply}
                onChange={(v) => set("placeOfSupply", v)}
                options={STATE_OPTIONS}
                error={errorFor("placeOfSupply", draft.placeOfSupply)}
                hint={
                  computed
                    ? computed.intraState
                      ? `Same state as the supplier: CGST + ${computed.stateTaxLabel}.`
                      : "Different state from the supplier: IGST."
                    : undefined
                }
              />
              <SelectField
                id="copyLabel"
                label="Copy"
                value={draft.copyLabel}
                onChange={(v) => set("copyLabel", v as InvoiceDraft["copyLabel"])}
                options={COPY_LABELS.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <details className="group rounded-xl border border-white/10 px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                Order and transport details <span className="font-normal text-muted-dim">Optional</span>
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField id="transport.orderNumber" label="Buyer's order / PO no." optional value={draft.transport.orderNumber} onChange={(v) => set("transport", { ...draft.transport, orderNumber: v })} />
                <TextField id="transport.vehicleNumber" label="Vehicle no." optional autoCapitalize="characters" value={draft.transport.vehicleNumber} onChange={(v) => set("transport", { ...draft.transport, vehicleNumber: v.toUpperCase() })} />
                <TextField id="transport.eWayBill" label="E-way bill no." optional inputMode="numeric" value={draft.transport.eWayBill} onChange={(v) => set("transport", { ...draft.transport, eWayBill: v })} hint="Enter it if you generated one on the e-way bill portal; this tool does not create e-way bills." />
                <TextField id="transport.transporter" label="Transporter" optional value={draft.transport.transporter} onChange={(v) => set("transport", { ...draft.transport, transporter: v })} />
                <TextField id="transport.from" label="From (place of origin)" optional value={draft.transport.from} onChange={(v) => set("transport", { ...draft.transport, from: v })} />
                <TextField id="transport.to" label="To (destination)" optional value={draft.transport.to} onChange={(v) => set("transport", { ...draft.transport, to: v })} />
              </div>
            </details>
            <YesNo
              name="reverseCharge"
              legend="Tax payable on reverse charge?"
              value={draft.reverseCharge}
              onChange={(v) => set("reverseCharge", v)}
            />
            <p className="-mt-2 text-xs leading-relaxed text-muted-dim">
              Choose Yes only when the law makes the recipient pay the GST (for example some goods transport services). The tax is then shown on the invoice but not added to the amount payable.
            </p>
            <Checkbox
              id="sezOrExport"
              label={gstCopy.sezLabel}
              checked={draft.sezOrExport}
              onChange={(v) => set("sezOrExport", v)}
            />

          </FormSection>

          <FormSection title="Recipient (bill to)">
            <YesNo
              name="recipientRegistered"
              legend="Is the recipient registered under GST?"
              value={draft.recipient.registered}
              onChange={(v) => set("recipient", { ...draft.recipient, registered: v })}
            />
            <TextField
              id="recipient.name"
              label="Name"
              optional={!draft.recipient.registered && !needsUnregisteredDetails}
              value={draft.recipient.name}
              onChange={(v) => set("recipient", { ...draft.recipient, name: v })}
              error={errorFor("recipient.name", draft.recipient.name)}
            />
            <TextArea
              id="recipient.address"
              label="Address"
              optional={!draft.recipient.registered && !needsUnregisteredDetails}
              value={draft.recipient.address}
              onChange={(v) => set("recipient", { ...draft.recipient, address: v })}
              error={errorFor("recipient.address", draft.recipient.address)}
            />
            {draft.recipient.registered ? (
              <TextField
                id="recipient.gstin"
                label="GSTIN"
                autoCapitalize="characters"
                maxLength={15}
                value={draft.recipient.gstin}
                onChange={(v) => set("recipient", { ...draft.recipient, gstin: v.toUpperCase() })}
                error={errorFor("recipient.gstin", draft.recipient.gstin)}
                hint={recipientCheck?.ok ? `State: ${stateLabel(recipientCheck.stateCode)}` : undefined}
              />
            ) : (
              <SelectField
                id="recipient.stateCode"
                label="State"
                optional={!needsUnregisteredDetails}
                placeholder="Choose state or UT"
                value={draft.recipient.stateCode}
                onChange={(v) => set("recipient", { ...draft.recipient, stateCode: v })}
                options={STATE_OPTIONS}
                error={errorFor("recipient.stateCode", draft.recipient.stateCode)}
              />
            )}
            <TextField
              id="recipient.phone"
              label="Phone"
              optional
              type="tel"
              inputMode="tel"
              value={draft.recipient.phone}
              onChange={(v) => set("recipient", { ...draft.recipient, phone: v })}
              error={errorFor("recipient.phone", draft.recipient.phone)}
            />
            {needsUnregisteredDetails ? (
              <p className="text-sm leading-relaxed text-muted">{gstCopy.unregisteredWhy}</p>
            ) : null}
            <Checkbox
              id="shipToDifferent"
              label="Ship to a different address"
              checked={draft.shipToDifferent}
              onChange={(v) => set("shipToDifferent", v)}
            />
            {draft.shipToDifferent ? (
              <div className="space-y-4">
                <TextField
                  id="shipTo.name"
                  label="Ship-to name"
                  optional
                  value={draft.shipTo.name}
                  onChange={(v) => set("shipTo", { ...draft.shipTo, name: v })}
                />
                <TextArea
                  id="shipTo.address"
                  label="Ship-to address"
                  value={draft.shipTo.address}
                  onChange={(v) => set("shipTo", { ...draft.shipTo, address: v })}
                  error={errorFor("shipTo.address", draft.shipTo.address)}
                />
                <SelectField
                  id="shipTo.stateCode"
                  label="Ship-to state"
                  optional={!needsUnregisteredDetails}
                  placeholder="Choose state or UT"
                  value={draft.shipTo.stateCode}
                  onChange={(v) => set("shipTo", { ...draft.shipTo, stateCode: v })}
                  options={STATE_OPTIONS}
                  error={errorFor("shipTo.stateCode", draft.shipTo.stateCode)}
                />
              </div>
            ) : null}
          </FormSection>

          <FormSection title="Items">
            <ItemsEditor
              lines={draft.lines}
              onChange={(lines) => set("lines", lines)}
              errorFor={errorFor}
              hsnOptional={draft.turnover === "upto5" && !draft.recipient.registered}
              intraState={computed ? computed.intraState : supplierState && draft.placeOfSupply ? supplierState === draft.placeOfSupply : null}
            />
            {attempted && errors.lines ? <p className="text-sm text-warning">{errors.lines}</p> : null}
          </FormSection>

          <FormSection title="Totals, payment and signature">
            <Checkbox
              id="roundOff"
              label="Round off to nearest rupee"
              checked={draft.roundOff}
              onChange={(v) => set("roundOff", v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="bank.accountName" label="Account name" optional value={draft.bank.accountName} onChange={(v) => set("bank", { ...draft.bank, accountName: v })} />
              <TextField id="bank.bankName" label="Bank" optional value={draft.bank.bankName} onChange={(v) => set("bank", { ...draft.bank, bankName: v })} />
              <TextField id="bank.accountNumber" label="Account number" optional inputMode="numeric" value={draft.bank.accountNumber} onChange={(v) => set("bank", { ...draft.bank, accountNumber: v })} />
              <TextField id="bank.ifsc" label="IFSC" optional autoCapitalize="characters" value={draft.bank.ifsc} onChange={(v) => set("bank", { ...draft.bank, ifsc: v.toUpperCase() })} />
            </div>
            <TextArea id="notes" label="Notes / terms" optional value={draft.notes} onChange={(v) => set("notes", v)} />
            <div>
              <p className="mb-1.5 text-sm font-medium">
                Signature image <span className="ml-1 font-normal text-muted-dim">Optional</span>
              </p>
              {draft.signature ? (
                <button
                  type="button"
                  onClick={() => set("signature", null)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X aria-hidden="true" className="size-4" />
                  Remove signature
                </button>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5 focus-within:ring-2 focus-within:ring-primary">
                  <Upload aria-hidden="true" className="size-4" />
                  Upload PNG or JPEG
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={(e) => onSignature(e.target.files?.[0])}
                  />
                </label>
              )}
              <p className="mt-1.5 text-xs text-muted-dim">
                The invoice always shows an &quot;Authorised Signatory&quot; line with your business name. The image stays in this browser.
              </p>
            </div>
          </FormSection>

          <div className="space-y-4">
            <p role="note" className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-foreground">
              {gstCopy.eInvoiceBanner}
            </p>
            {block ? (
              <p role="alert" className="rounded-xl border border-warning/60 bg-warning/15 px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground">
                {block}
              </p>
            ) : null}
            {attempted && hasErrors && !block ? (
              <p role="alert" className="text-sm text-warning">
                Some details are missing or invalid. Check the highlighted fields above.
              </p>
            ) : null}
            {downloadError ? (
              <p role="alert" className="text-sm text-warning">
                {downloadError}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" size="lg" onClick={() => download("pdf")} disabled={busy !== null || block !== null} className="w-full sm:w-auto">
                <Download aria-hidden="true" className="size-4" />
                {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => download("xlsx")} disabled={busy !== null || block !== null} className="w-full sm:w-auto">
                <FileSpreadsheet aria-hidden="true" className="size-4" />
                {busy === "xlsx" ? "Preparing Excel…" : "Download Excel"}
              </Button>
            </div>
            <p className="text-sm text-muted">{gstCopy.privacyLine}</p>
          </div>
        </form>

        <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <h2 className="mb-3 text-sm font-medium text-muted">Live preview</h2>
          <InvoicePreview view={block ? null : view} />
        </div>
      </div>
    </div>
  );
}
