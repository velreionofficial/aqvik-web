"use client";

import * as React from "react";
import { Download, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormSection, TextField } from "@/components/tools/gst/fields";
import {
  UNIT_OPTIONS,
  compareLine,
  derivedCopy,
  dupontCopy,
  inputSections,
  ratioDisclaimer,
  ratioTool,
  resultGroups,
} from "@/content/ratio-analyzer";
import { EXAMPLE, analyse, display, emptyInputs, fieldError, type Field, type RatioInputs, type Unit } from "@/lib/ratios/ratios";
import type { RatioReport } from "@/lib/ratios/report";
import { cn } from "@/lib/utils";

const unitLabel = (unit: Unit) => UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? "₹";

export function RatioAnalyzer({ initialInputs, initialUnit = "crore" }: { initialInputs?: RatioInputs; initialUnit?: Unit }) {
  const [inputs, setInputs] = React.useState<RatioInputs>(() => initialInputs ?? emptyInputs());
  const [unit, setUnit] = React.useState<Unit>(initialUnit);
  const [busy, setBusy] = React.useState<"pdf" | "xlsx" | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const results = React.useMemo(() => analyse(inputs, unit), [inputs, unit]);
  const set = (field: Field, value: string) => setInputs((prev) => ({ ...prev, [field]: value }));
  const anyInput = Object.values(inputs).some((v) => v.trim() !== "");

  const report = (): RatioReport => ({
    title: ratioTool.name,
    unitLabel: unitLabel(unit),
    inputs: inputSections.map((s) => ({
      section: s.title,
      rows: s.fields.map((f) => [f.label, inputs[f.field].trim() || "—"] as [string, string]),
    })),
    derived: derivedCopy.map((d) => [d.label, display(results.derived[d.key], "amount"), d.formula]),
    groups: resultGroups.map((g) => ({
      title: g.title,
      rows: g.items.map((i) => [i.label, display(results.ratios[i.id], i.style), i.formula] as [string, string, string]),
    })),
    dupont: [
      ["Net profit margin", display(results.dupont.margin, "percent")],
      ["Asset turnover", display(results.dupont.turnover, "times")],
      ["Equity multiplier", display(results.dupont.multiplier, "times")],
      ["ROE (product)", display(results.dupont.product, "percent")],
    ],
    dupontNote: dupontCopy.roundingNote,
    disclaimer: ratioDisclaimer,
  });

  const download = async (kind: "pdf" | "xlsx") => {
    setMessage(null);
    setBusy(kind);
    try {
      const blob =
        kind === "pdf"
          ? await (await import("@/lib/ratios/export-pdf")).createRatioPdf(report())
          : await (await import("@/lib/ratios/export-xlsx")).createRatioXlsx(report());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-ratios.${kind}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage("The file could not be created. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const value = (text: string, ok: boolean) => (
    <span className={cn("text-right tabular-nums", ok ? "text-[1.0625rem] font-semibold text-foreground" : "text-sm text-muted-dim")}>{text}</span>
  );

  return (
    <div className="space-y-4">
      <div className="glass flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">Amounts are in</legend>
          <div className="flex flex-wrap gap-2">
            {UNIT_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary",
                  unit === o.value ? "border-primary bg-primary text-primary-foreground" : "border-white/10 text-muted hover:text-foreground",
                )}
              >
                <input type="radio" name="unit" className="sr-only" checked={unit === o.value} onChange={() => setUnit(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setInputs({ ...EXAMPLE });
              setUnit("crore");
            }}
          >
            Load example
          </Button>
          <Button type="button" variant="ghost" onClick={() => setInputs(emptyInputs())} disabled={!anyInput}>
            Clear
          </Button>
        </div>
        <a href="#ratio-results" className="rounded-sm text-sm text-primary-soft underline-offset-4 hover:underline xl:hidden">
          Jump to results ↓
        </a>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="min-w-0 space-y-4" onSubmit={(e) => e.preventDefault()} noValidate aria-label="Figures from the accounts">
          {inputSections.map((section) => (
            <FormSection key={section.title} title={section.title}>
              {section.note ? <p className="-mt-2 text-sm leading-relaxed text-muted">{section.note}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <TextField
                    key={f.field}
                    id={`ratio-${f.field}`}
                    label={f.field === "shares" || f.field === "price" ? f.label : `${f.label} (${unitLabel(unit)})`}
                    optional={f.optional}
                    inputMode={f.field === "shares" ? "numeric" : "decimal"}
                    value={inputs[f.field]}
                    onChange={(v) => set(f.field, v)}
                    hint={f.hint}
                    error={fieldError(f.field, inputs[f.field]) ?? undefined}
                  />
                ))}
              </div>
            </FormSection>
          ))}
        </form>

        <div id="ratio-results" className="min-w-0 scroll-mt-24 space-y-4" aria-live="polite">
          <FormSection title={`Worked out from your figures (${unitLabel(unit)})`}>
            <dl className="divide-y divide-hairline">
              {derivedCopy.map((d) => {
                const r = results.derived[d.key];
                return (
                  <div key={d.key} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-[0.9375rem] text-muted">
                      {d.label}
                      <span className="block text-xs text-muted-dim">{d.formula}</span>
                    </dt>
                    <dd>{value(display(r, "amount"), r.ok)}</dd>
                  </div>
                );
              })}
            </dl>
          </FormSection>

          {resultGroups.map((group) => (
            <FormSection key={group.title} title={group.title}>
              <dl className="divide-y divide-hairline">
                {group.items.map((item) => {
                  const r = results.ratios[item.id];
                  return (
                    <div key={item.id} className="py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-[0.9375rem] font-medium text-foreground">{item.label}</dt>
                        <dd>{value(display(r, item.style), r.ok)}</dd>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{item.means}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-dim">
                        {compareLine} Formula: {item.formula}.
                      </p>
                    </div>
                  );
                })}
              </dl>
            </FormSection>
          ))}

          <FormSection title={dupontCopy.title}>
            <p className="-mt-2 text-sm leading-relaxed text-muted">{dupontCopy.means}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[1.0625rem] font-semibold tabular-nums text-foreground">
              {results.dupont.product.ok ? (
                <>
                  <span>{display(results.dupont.margin, "percent")}</span>
                  <span aria-hidden="true" className="text-muted-dim">×</span>
                  <span>{display(results.dupont.turnover, "times")}</span>
                  <span aria-hidden="true" className="text-muted-dim">×</span>
                  <span>{display(results.dupont.multiplier, "times")}</span>
                  <span aria-hidden="true" className="text-muted-dim">=</span>
                  <span>{display(results.dupont.product, "percent")}</span>
                </>
              ) : (
                <span className="text-sm font-normal text-muted-dim">{display(results.dupont.product, "percent")}</span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-dim">
              Net profit margin × Asset turnover × Equity multiplier (Total assets ÷ Total equity). {dupontCopy.roundingNote} {compareLine}
            </p>
          </FormSection>

          <div className="space-y-3">
            {message ? (
              <p role="alert" className="text-sm text-warning">
                {message}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" size="lg" onClick={() => download("pdf")} disabled={busy !== null || !anyInput} className="w-full sm:w-auto">
                <Download aria-hidden="true" className="size-4" />
                {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
              </Button>
              <Button type="button" size="lg" variant="secondary" onClick={() => download("xlsx")} disabled={busy !== null || !anyInput} className="w-full sm:w-auto">
                <FileSpreadsheet aria-hidden="true" className="size-4" />
                {busy === "xlsx" ? "Preparing Excel…" : "Download Excel"}
              </Button>
            </div>
            <p className="text-sm text-muted">Nothing you type leaves your browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
