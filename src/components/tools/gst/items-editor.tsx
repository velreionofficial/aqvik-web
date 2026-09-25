"use client";

import { Plus, Trash2 } from "lucide-react";

import { gstCopy } from "@/content/gst-invoice";
import {
  GOODS_CATEGORIES,
  SERVICE_CATEGORIES,
  categoryForItem,
  findCategory,
  type Category,
} from "@/lib/gst/classification";
import { GST_RATE_OPTIONS, UNITS, computeLine, type ItemKind, type LineDraft } from "@/lib/gst/invoice";
import { formatPaise } from "@/lib/gst/money";
import { SelectField, TextField } from "@/components/tools/gst/fields";
import { Combobox } from "@/components/tools/gst/combobox";

const categoryOptions = (list: readonly Category[]) =>
  list.map((c) => ({ value: c.id, label: c.name, group: c.group, code: c.prefix }));
const GOODS_CATEGORY_OPTIONS = categoryOptions(GOODS_CATEGORIES);
const SERVICE_CATEGORY_OPTIONS = categoryOptions(SERVICE_CATEGORIES);
const itemOptions = (list: readonly Category[]) => {
  const seen = new Set<string>();
  return list.flatMap((c) =>
    c.items
      .filter((item) => (seen.has(item) ? false : (seen.add(item), true)))
      .map((item) => ({ value: item, label: item, group: c.name })),
  );
};
const GOODS_ITEM_OPTIONS = itemOptions(GOODS_CATEGORIES);
const SERVICE_ITEM_OPTIONS = itemOptions(SERVICE_CATEGORIES);
import { cn } from "@/lib/utils";

const WEIGHT_UNITS = new Set(["MTS", "TON", "QTL"]);

/** The first line uses a fixed id so server and browser render the same markup. */
export function newLine(id = Math.random().toString(36).slice(2, 10)): LineDraft {
  return {
    id,
    kind: "goods",
    category: "",
    description: "",
    hsn: "",
    details: "",
    quantity: "1",
    unit: "NOS",
    pricing: "rate",
    rate: "",
    amount: "",
    discount: "",
    gstRate: "18",
    customRate: "",
  };
}

export function ItemsEditor({
  lines,
  onChange,
  errorFor,
  intraState,
  hsnOptional = false,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  errorFor: (key: string, value: string) => string | undefined;
  intraState: boolean | null;
  /** Up to ₹5 crore turnover and an unregistered buyer: HSN may be left out. */
  hsnOptional?: boolean;
}) {
  const update = (id: string, patch: Partial<LineDraft>) =>
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));

  const setKind = (line: LineDraft, kind: ItemKind) => {
    if (kind === line.kind) return;
    update(line.id, {
      kind,
      category: "",
      unit: kind === "service" ? "OTH" : "NOS",
      pricing: kind === "service" ? "amount" : "rate",
    });
  };

  /**
   * A category sets a sensible unit and pricing mode (the user can change
   * both). For services it also fills the 4-digit SAC heading if the code box
   * is empty; for goods the HSN code depends on the exact product.
   */
  const categoryPatch = (line: LineDraft, category: Category): Partial<LineDraft> => ({
    kind: category.kind,
    category: category.id,
    unit: category.unit,
    pricing: category.pricing,
    ...(category.kind === "service" && line.hsn.trim() === "" ? { hsn: category.prefix } : {}),
  });

  const setCategory = (line: LineDraft, id: string) => {
    const category = findCategory(id);
    update(line.id, category ? categoryPatch(line, category) : { category: "" });
  };

  /** Typing or picking a known item fills its category when none is chosen yet. */
  const setDescription = (line: LineDraft, value: string) => {
    const match = line.category ? undefined : categoryForItem(value);
    update(line.id, match ? { description: value, ...categoryPatch(line, match) } : { description: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 text-xs leading-relaxed text-muted-dim">
        <p>{gstCopy.rateNote}</p>
        <p>
          {gstCopy.rateHelp}{" "}
          <a
            href={gstCopy.hsnSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm text-primary-soft underline underline-offset-2"
          >
            Search HSN/SAC on the GST portal
          </a>
        </p>
      </div>
      <ol className="space-y-4">
        {lines.map((line, index) => {
          const key = `lines.${line.id}`;
          const computed = intraState === null ? null : computeLine(line, intraState);
          const category = findCategory(line.category);
          const isService = line.kind === "service";
          return (
            <li key={line.id} className="rounded-xl border border-white/10 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-xs text-muted-dim">Item {index + 1}</p>
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onChange(lines.filter((l) => l.id !== line.id))}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                    Remove item {index + 1}
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-6">
                <fieldset className="sm:col-span-6">
                  <legend className="mb-2 text-sm font-medium text-foreground">Type</legend>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "goods", label: "Goods (HSN)" },
                        { value: "service", label: "Service (SAC)" },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary",
                          line.kind === option.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/10 text-muted hover:text-foreground",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${key}.kind`}
                          checked={line.kind === option.value}
                          onChange={() => setKind(line, option.value)}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="sm:col-span-6">
                  <Combobox
                    id={`${key}.category`}
                    label="Category"
                    optional
                    placeholder={isService ? "Type to search, e.g. transport, rent, repair" : "Type to search, e.g. cement, steel, food"}
                    text={category ? category.name : ""}
                    options={isService ? SERVICE_CATEGORY_OPTIONS : GOODS_CATEGORY_OPTIONS}
                    onPick={(option) => setCategory(line, option.value)}
                    onClear={() => setCategory(line, "")}
                    hint={
                      category
                        ? isService
                          ? `SAC codes in this heading start with ${category.prefix}. The GST rate is still yours to choose.`
                          : `HSN codes in this chapter start with ${category.prefix}. Find the full code for your exact product; the GST rate is yours to choose.`
                        : isService
                          ? "All 31 official SAC headings. Type a letter or a word to filter."
                          : "All 96 official HSN chapters. Type a letter or a word to filter."
                    }
                  />
                </div>
                {category?.note ? (
                  <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-relaxed text-foreground sm:col-span-6">
                    {category.note}
                  </p>
                ) : null}
                <div className="sm:col-span-4">
                  <Combobox
                    id={`${key}.description`}
                    label={isService ? "Service" : "Item"}
                    freeText
                    placeholder="Type to search, or write your own"
                    text={line.description}
                    onTextChange={(v) => setDescription(line, v)}
                    onPick={(option) => setDescription(line, option.value)}
                    options={
                      category
                        ? category.items.map((item) => ({ value: item, label: item }))
                        : isService
                          ? SERVICE_ITEM_OPTIONS
                          : GOODS_ITEM_OPTIONS
                    }
                    error={errorFor(`${key}.description`, line.description)}
                  />
                </div>
                <TextField
                  className="sm:col-span-2"
                  id={`${key}.hsn`}
                  label={line.kind === "service" ? "SAC code" : "HSN code"}
                  optional={hsnOptional}
                  inputMode="numeric"
                  maxLength={8}
                  value={line.hsn}
                  onChange={(v) => update(line.id, { hsn: v.replace(/\D/g, "") })}
                  error={errorFor(`${key}.hsn`, line.hsn)}
                  hint={index === 0 ? (hsnOptional ? gstCopy.hsnOptionalHint : gstCopy.hsnHint) : undefined}
                />
                <TextField
                  className="sm:col-span-6"
                  id={`${key}.details`}
                  label={isService ? "Service details" : "Exact product name / brand / grade"}
                  optional
                  placeholder={isService ? "e.g. Vehicle no. BR25GA9505, September 2026, site: Gaya" : "e.g. UltraTech PPC 50 kg, Fe 500D 12 mm, 20 mm gitti"}
                  value={line.details}
                  onChange={(v) => update(line.id, { details: v })}
                  hint="Printed on the invoice after the name, so the buyer knows exactly what was supplied."
                />

                <fieldset className="sm:col-span-6">
                  <legend className="mb-2 text-sm font-medium text-foreground">Price by</legend>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "rate", label: "Rate per unit" },
                        { value: "amount", label: "Total amount" },
                      ] as const
                    ).map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary",
                          line.pricing === option.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/10 text-muted hover:text-foreground",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${key}.pricing`}
                          checked={line.pricing === option.value}
                          onChange={() => update(line.id, { pricing: option.value })}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <TextField
                  className="sm:col-span-2"
                  id={`${key}.quantity`}
                  label="Quantity"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(v) => update(line.id, { quantity: v })}
                  error={errorFor(`${key}.quantity`, line.quantity)}
                  hint={WEIGHT_UNITS.has(line.unit) ? "30 ton 500 kg = 30.5 (up to 3 decimals, so kilograms fit)." : undefined}
                />
                <SelectField
                  className="sm:col-span-2"
                  id={`${key}.unit`}
                  label="Unit"
                  value={line.unit}
                  onChange={(v) => update(line.id, { unit: v })}
                  options={UNITS.map((u) => ({ value: u.code, label: `${u.code} – ${u.name}` }))}
                />
                {line.pricing === "rate" ? (
                  <TextField
                    className="sm:col-span-2"
                    id={`${key}.rate`}
                    label={`Rate (₹ per ${line.unit})`}
                    inputMode="decimal"
                    value={line.rate}
                    onChange={(v) => update(line.id, { rate: v })}
                    error={errorFor(`${key}.rate`, line.rate)}
                  />
                ) : (
                  <TextField
                    className="sm:col-span-2"
                    id={`${key}.amount`}
                    label="Amount (₹)"
                    inputMode="decimal"
                    value={line.amount}
                    onChange={(v) => update(line.id, { amount: v })}
                    error={errorFor(`${key}.amount`, line.amount)}
                    hint="Before discount and GST."
                  />
                )}
                <TextField
                  className="sm:col-span-2"
                  id={`${key}.discount`}
                  label="Discount %"
                  optional
                  inputMode="decimal"
                  value={line.discount}
                  onChange={(v) => update(line.id, { discount: v })}
                  error={errorFor(`${key}.discount`, line.discount)}
                />
                <SelectField
                  className="sm:col-span-2"
                  id={`${key}.gstRate`}
                  label="GST rate"
                  value={line.gstRate}
                  onChange={(v) => update(line.id, { gstRate: v })}
                  options={[
                    ...GST_RATE_OPTIONS.map((r) => ({ value: r, label: `${r}%` })),
                    { value: "other", label: "Other" },
                  ]}
                  error={line.gstRate === "other" ? undefined : errorFor(`${key}.gstRate`, line.gstRate)}
                />
                {line.gstRate === "other" ? (
                  <TextField
                    className="sm:col-span-2"
                    id={`${key}.customRate`}
                    label="Custom GST %"
                    inputMode="decimal"
                    value={line.customRate}
                    onChange={(v) => update(line.id, { customRate: v })}
                    error={errorFor(`${key}.gstRate`, line.customRate)}
                  />
                ) : null}
              </div>
              {computed ? (
                <p className="mt-3 text-right text-sm tabular-nums text-muted">
                  {line.pricing === "amount" ? `Rate ₹${formatPaise(computed.ratePaise)} per ${line.unit} · ` : null}
                  Taxable ₹{formatPaise(computed.taxable)} · Tax ₹{formatPaise(computed.cgst + computed.sgst + computed.igst)} ·{" "}
                  <span className="text-foreground">Total ₹{formatPaise(computed.total)}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => onChange([...lines, newLine()])}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-foreground hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Plus aria-hidden="true" className="size-4" />
        Add item
      </button>
    </div>
  );
}
