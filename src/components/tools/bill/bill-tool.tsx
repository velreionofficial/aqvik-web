"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Plus, Share2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/tools/gst/combobox";
import { Checkbox, FormSection, SelectField, TextArea, TextField } from "@/components/tools/gst/fields";
import { BillPreview } from "@/components/tools/bill/bill-preview";
import { billCopy, registrationGate } from "@/content/bill-tools";
import {
  BILL_TITLES,
  PAYMENT_MODES,
  billFileName,
  buildBillView,
  computeBill,
  computeBillLine,
  validateBill,
  type BillDraft,
  type BillKind,
  type BillLine,
} from "@/lib/bill/bill";
import { ALL_CATEGORIES } from "@/lib/gst/classification";
import { UNITS } from "@/lib/gst/invoice";
import { formatPaise } from "@/lib/gst/money";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "aqvik-bill-shop-v1";
const ITEM_OPTIONS = [...new Set(ALL_CATEGORIES.flatMap((c) => c.items))].map((item) => ({ value: item, label: item }));

function newLine(id = Math.random().toString(36).slice(2, 10)): BillLine {
  return { id, description: "", quantity: "1", unit: "NOS", pricing: "rate", rate: "", amount: "", discount: "" };
}

export function emptyBill(kind: BillKind): BillDraft {
  return {
    kind,
    title: kind === "quotation" ? "QUOTATION" : "BILL",
    shop: { name: "", address: "", phone: "" },
    number: "",
    date: "",
    validUntil: "",
    customer: { name: "", phone: "", address: "" },
    lines: [newLine("line-1")],
    roundOff: true,
    paymentMode: "",
    amountPaid: "",
    taxNote: "",
    notes: "",
  };
}

function Pill({ active, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { active: boolean }) {
  return (
    <label
      {...props}
      className={cn(
        "cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary",
        active ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted hover:text-foreground",
      )}
    >
      {children}
    </label>
  );
}

/** "Are you registered under GST?" in English and Hinglish, shown before the bill form. */
function RegistrationGate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-7">
      <fieldset>
        <legend className="text-[1.0625rem] font-semibold text-foreground">
          {registrationGate.question}
          <span className="mt-1 block text-[0.9375rem] font-normal text-muted">{registrationGate.questionHinglish}</span>
        </legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {registrationGate.options.map((o) => (
            <label
              key={o.value}
              className={cn(
                "cursor-pointer rounded-xl border px-4 py-3 text-left focus-within:ring-2 focus-within:ring-primary",
                value === o.value ? "border-primary bg-primary/15" : "border-white/10 hover:bg-white/5",
              )}
            >
              <input type="radio" name="gst-registration" className="sr-only" checked={value === o.value} onChange={() => onChange(o.value)} />
              <span className="block text-[0.9375rem] font-medium text-foreground">{o.label}</span>
              <span className="mt-0.5 block text-sm text-muted">{o.hinglish}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {value === "regular" ? (
        <div role="status" className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem] leading-relaxed">
          <p>{registrationGate.regular}</p>
          <p className="mt-1 text-muted">{registrationGate.regularHinglish}</p>
          <Link href="/tools/gst-invoice-generator" className="mt-2 inline-block text-primary-soft underline underline-offset-4">
            {registrationGate.regularLink} →
          </Link>
        </div>
      ) : null}
      {value === "composition" ? (
        <div role="status" className="mt-5 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem] leading-relaxed">
          <p>{registrationGate.composition}</p>
          <p className="mt-1 text-muted">{registrationGate.compositionHinglish}</p>
          <Link href="/tools/bill-of-supply" className="mt-2 inline-block text-primary-soft underline underline-offset-4">
            {registrationGate.compositionLink} →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function BillTool({ kind, initialDraft, initialGate = "" }: { kind: BillKind; initialDraft?: BillDraft; initialGate?: string }) {
  const [gate, setGate] = React.useState(kind === "quotation" ? "no" : initialGate);
  const [draft, setDraft] = React.useState<BillDraft>(() => initialDraft ?? emptyBill(kind));
  const [remember, setRemember] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);
  const [size, setSize] = React.useState<"a4" | "receipt">("a4");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    setDraft((d) => (d.date ? d : { ...d, date: new Date().toLocaleDateString("en-CA") }));
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const shop = JSON.parse(raw) as BillDraft["shop"];
        setRemember(true);
        setDraft((d) => ({ ...d, shop: { ...d.shop, ...shop } }));
      }
    } catch {
      /* storage unavailable */
    }
    setCanShare(typeof navigator !== "undefined" && typeof navigator.canShare === "function");
  }, []);

  React.useEffect(() => {
    if (!remember) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft.shop));
    } catch {
      /* ignore */
    }
  }, [remember, draft.shop]);

  const forget = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setRemember(false);
  };

  const set = <K extends keyof BillDraft>(key: K, value: BillDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const updateLine = (id: string, patch: Partial<BillLine>) =>
    set("lines", draft.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const errors = React.useMemo(() => validateBill(draft), [draft]);
  const bill = React.useMemo(() => (draft.shop.name.trim() ? computeBill(draft) : null), [draft]);
  const view = React.useMemo(() => (bill ? buildBillView(draft, bill) : null), [draft, bill]);
  const errorFor = (key: string, value: string) => (attempted || value.trim() !== "" ? errors[key] : undefined);
  const isQuote = kind === "quotation";
  const noun = isQuote ? "Quotation" : "Bill";

  const makePdf = async () => {
    setAttempted(true);
    setMessage(null);
    if (Object.keys(errors).length > 0 || !view) {
      setMessage("Some details are missing or invalid. Check the highlighted fields above.");
      return null;
    }
    setBusy(true);
    try {
      const { createBillPdf } = await import("@/lib/bill/export-pdf");
      const blob = await createBillPdf(view, size);
      return new File([blob], billFileName(draft.number, draft.date, isQuote ? "quotation" : "bill"), { type: "application/pdf" });
    } catch {
      setMessage("The PDF could not be created. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const file = await makePdf();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async () => {
    const file = await makePdf();
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: file.name });
      } catch {
        /* the user closed the share sheet */
      }
    } else {
      setMessage("Sharing files is not supported in this browser. Use Download instead.");
    }
  };

  const gateView = kind === "bill" ? <RegistrationGate value={gate} onChange={setGate} /> : null;
  if (gate !== "no") return gateView;

  return (
    <div className="space-y-4">
      {gateView}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label={`${noun} details`}>
          <FormSection title={isQuote ? "Your business" : "Your shop"}>
            <TextField id="shop.name" label={isQuote ? "Business name" : "Shop name"} value={draft.shop.name} onChange={(v) => set("shop", { ...draft.shop, name: v })} error={errorFor("shop.name", draft.shop.name)} />
            <TextArea id="shop.address" label="Address" optional value={draft.shop.address} onChange={(v) => set("shop", { ...draft.shop, address: v })} />
            <TextField id="shop.phone" label="Phone" optional type="tel" inputMode="tel" value={draft.shop.phone} onChange={(v) => set("shop", { ...draft.shop, phone: v })} error={errorFor("shop.phone", draft.shop.phone)} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Checkbox id="remember" label={billCopy.rememberLabel} checked={remember} onChange={(v) => (v ? setRemember(true) : forget())} hint={billCopy.rememberHint} />
              <button type="button" onClick={forget} className="rounded-md px-2 py-1 text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {billCopy.forget}
              </button>
            </div>
          </FormSection>

          <FormSection title={noun}>
            {!isQuote ? (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">Title on the bill</legend>
                <div className="flex flex-wrap gap-2">
                  {BILL_TITLES.map((t) => (
                    <Pill key={t} active={draft.title === t}>
                      <input type="radio" name="bill-title" className="sr-only" checked={draft.title === t} onChange={() => set("title", t)} />
                      {t}
                    </Pill>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="number" label={`${noun} number`} maxLength={30} placeholder={isQuote ? "e.g. Q-001" : "e.g. 001"} value={draft.number} onChange={(v) => set("number", v)} error={errorFor("number", draft.number)} />
              <TextField id="date" label="Date" type="date" value={draft.date} onChange={(v) => set("date", v)} error={errorFor("date", draft.date)} />
              {isQuote ? (
                <TextField id="validUntil" label="Valid until" optional type="date" value={draft.validUntil} onChange={(v) => set("validUntil", v)} error={errors.validUntil} />
              ) : null}
            </div>
          </FormSection>

          <FormSection title="Customer">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="customer.name" label="Name" optional value={draft.customer.name} onChange={(v) => set("customer", { ...draft.customer, name: v })} />
              <TextField id="customer.phone" label="Phone" optional type="tel" inputMode="tel" value={draft.customer.phone} onChange={(v) => set("customer", { ...draft.customer, phone: v })} error={errorFor("customer.phone", draft.customer.phone)} />
            </div>
            <TextArea id="customer.address" label="Address" optional rows={2} value={draft.customer.address} onChange={(v) => set("customer", { ...draft.customer, address: v })} />
          </FormSection>

          <FormSection title="Items">
            <ol className="space-y-4">
              {draft.lines.map((line, index) => {
                const key = `lines.${line.id}`;
                const computed = computeBillLine(line);
                return (
                  <li key={line.id} className="rounded-xl border border-white/10 bg-background/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-mono text-xs text-muted-dim">Item {index + 1}</p>
                      {draft.lines.length > 1 ? (
                        <button type="button" onClick={() => set("lines", draft.lines.filter((l) => l.id !== line.id))} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                          <Trash2 aria-hidden="true" className="size-3.5" />
                          Remove item {index + 1}
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-6">
                      <div className="sm:col-span-6">
                        <Combobox
                          id={`${key}.description`}
                          label="Item"
                          freeText
                          placeholder="Type the item name, e.g. rice, cement, repair"
                          text={line.description}
                          onTextChange={(v) => updateLine(line.id, { description: v })}
                          onPick={(o) => updateLine(line.id, { description: o.value })}
                          options={ITEM_OPTIONS}
                          error={errorFor(`${key}.description`, line.description)}
                        />
                      </div>
                      <fieldset className="sm:col-span-6">
                        <legend className="mb-2 text-sm font-medium text-foreground">Price by</legend>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { value: "rate", label: "Price per unit" },
                              { value: "amount", label: "Total amount" },
                            ] as const
                          ).map((o) => (
                            <Pill key={o.value} active={line.pricing === o.value}>
                              <input type="radio" name={`${key}.pricing`} className="sr-only" checked={line.pricing === o.value} onChange={() => updateLine(line.id, { pricing: o.value })} />
                              {o.label}
                            </Pill>
                          ))}
                        </div>
                      </fieldset>
                      <TextField className="sm:col-span-2" id={`${key}.quantity`} label="Quantity" inputMode="decimal" value={line.quantity} onChange={(v) => updateLine(line.id, { quantity: v })} error={errorFor(`${key}.quantity`, line.quantity)} />
                      <SelectField className="sm:col-span-2" id={`${key}.unit`} label="Unit" value={line.unit} onChange={(v) => updateLine(line.id, { unit: v })} options={UNITS.map((u) => ({ value: u.code, label: `${u.code} – ${u.name}` }))} />
                      {line.pricing === "rate" ? (
                        <TextField className="sm:col-span-2" id={`${key}.rate`} label={`Price (₹ per ${line.unit})`} inputMode="decimal" value={line.rate} onChange={(v) => updateLine(line.id, { rate: v })} error={errorFor(`${key}.rate`, line.rate)} />
                      ) : (
                        <TextField className="sm:col-span-2" id={`${key}.amount`} label="Amount (₹)" inputMode="decimal" value={line.amount} onChange={(v) => updateLine(line.id, { amount: v })} error={errorFor(`${key}.amount`, line.amount)} />
                      )}
                      <TextField className="sm:col-span-2" id={`${key}.discount`} label="Discount %" optional inputMode="decimal" value={line.discount} onChange={(v) => updateLine(line.id, { discount: v })} error={errorFor(`${key}.discount`, line.discount)} />
                    </div>
                    {computed ? (
                      <p className="mt-3 text-right text-sm tabular-nums text-muted">
                        Amount <span className="text-foreground">₹{formatPaise(computed.amount)}</span>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={() => set("lines", [...draft.lines, newLine()])} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Plus aria-hidden="true" className="size-4" />
              Add item
            </button>
            {attempted && errors.lines ? <p className="text-sm text-warning">{errors.lines}</p> : null}
          </FormSection>

          <FormSection title={isQuote ? "Totals and terms" : "Totals and payment"}>
            <Checkbox id="roundOff" label="Round off to nearest rupee" checked={draft.roundOff} onChange={(v) => set("roundOff", v)} />
            {isQuote ? (
              <TextField id="taxNote" label="Tax note" optional placeholder="e.g. GST extra as applicable" value={draft.taxNote} onChange={(v) => set("taxNote", v)} hint="This tool does not calculate tax on quotations. Say here how taxes apply." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField id="paymentMode" label="Payment mode" optional value={draft.paymentMode} onChange={(v) => set("paymentMode", v as BillDraft["paymentMode"])} options={PAYMENT_MODES.filter(Boolean).map((m) => ({ value: m, label: m }))} placeholder="Not shown" />
                <TextField id="amountPaid" label="Amount received (₹)" optional inputMode="decimal" value={draft.amountPaid} onChange={(v) => set("amountPaid", v)} error={errorFor("amountPaid", draft.amountPaid)} hint="Shows the balance due on the bill." />
              </div>
            )}
            <TextArea id="notes" label="Notes" optional placeholder={isQuote ? "e.g. Delivery in 7 days. 50% advance." : "e.g. Goods once sold will not be taken back."} value={draft.notes} onChange={(v) => set("notes", v)} />
          </FormSection>

          <div className="space-y-4">
            {!isQuote ? <p className="text-xs leading-relaxed text-muted-dim">{billCopy.registrationNote}</p> : null}
            {message ? (
              <p role="alert" className="text-sm text-warning">
                {message}
              </p>
            ) : null}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">PDF size</legend>
              <div className="flex flex-wrap gap-2">
                <Pill active={size === "a4"}>
                  <input type="radio" name="pdf-size" className="sr-only" checked={size === "a4"} onChange={() => setSize("a4")} />
                  A4 page
                </Pill>
                <Pill active={size === "receipt"}>
                  <input type="radio" name="pdf-size" className="sr-only" checked={size === "receipt"} onChange={() => setSize("receipt")} />
                  Receipt (80 mm)
                </Pill>
              </div>
            </fieldset>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" size="lg" onClick={download} disabled={busy} className="w-full sm:w-auto">
                <Download aria-hidden="true" className="size-4" />
                {busy ? "Preparing PDF…" : "Download PDF"}
              </Button>
              {canShare ? (
                <Button type="button" size="lg" variant="secondary" onClick={share} disabled={busy} className="w-full sm:w-auto">
                  <Share2 aria-hidden="true" className="size-4" />
                  Share PDF
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-muted">{billCopy.privacyLine}</p>
          </div>
        </form>

        <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <h2 className="mb-3 text-sm font-medium text-muted">Live preview</h2>
          <BillPreview view={view} />
        </div>
      </div>
    </div>
  );
}
