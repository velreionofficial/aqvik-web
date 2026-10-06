"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileUp, Lock, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { joinBetaHref } from "@/content/site";
import { statementCopy } from "@/content/statement-analyzer";
import { MoneyReport, Transactions, kindFor } from "@/components/tools/statement/money-report";
import { MoneyReview } from "@/components/tools/statement/money-review";
import { logEvent } from "@/lib/events";
import { readStatementContext, runEngine, toRaw, type RawTxn, type StatementContext, type TxnType, type UserEdit, type UserRule } from "@/lib/statement/engine";
import {
  FIELDS,
  balanceCheck,
  detectHeader,
  findOpeningBalance,
  extractTransactions,
  mappingForRow,
  problemReport,
  reconcileWithBalance,
  type Field,
  type Header,
  type Mapping,
} from "@/lib/statement/detect";
import { parseDelimited } from "@/lib/statement/parse";
import { lineReport, transactionsFromLines } from "@/lib/statement/text-lines";
import type { ReadResult } from "@/lib/statement/read-file";
import { SAMPLE_CSV } from "@/lib/statement/sample";
import { cn } from "@/lib/utils";

const rupees = (paise: number) =>
  `${paise < 0 ? "−" : ""}₹${(Math.abs(paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortDate = (iso: string) => iso.split("-").reverse().join("-");

const FIELD_LABELS: Record<Field, string> = {
  date: "Date",
  narration: "Description",
  debit: "Money out (debit)",
  credit: "Money in (credit)",
  amount: "Single amount column",
  drcr: "Dr / Cr column",
  balance: "Balance",
};

type Loaded = { name: string; kind: string; grid: string[][]; lines?: string[]; sample?: boolean };
/** A statement that passed the checks and is part of the report. */
type Accepted = { id: string; name: string; raw: RawTxn[]; checked: number | null; app: boolean; from: string; to: string; context: StatementContext; sample?: boolean };

const headerTexts = (l: { grid: string[][]; lines?: string[] }) => [...l.grid.slice(0, 60).flat(), ...(l.lines ?? []).slice(0, 60)];

function sampleAccepted(): Accepted {
  const grid = parseDelimited(SAMPLE_CSV);
  const txns = extractTransactions(grid, detectHeader(grid)!).txns;
  return { id: "file1", sample: true, name: "sample-statement.csv", raw: toRaw(txns, "file1"), checked: balanceCheck(txns).matched, app: false, from: txns[0]!.date, to: txns[txns.length - 1]!.date, context: readStatementContext(headerTexts({ grid })) };
}

export function StatementAnalyzer({ demo }: { /** Start on the sample (screenshots and previews). */ demo?: "review" | "results" } = {}) {
  const [loaded, setLoaded] = React.useState<Loaded | null>(() =>
    demo === "review" ? { name: "sample-statement.csv", kind: "csv", grid: parseDelimited(SAMPLE_CSV) } : null,
  );
  const [files, setFiles] = React.useState<Accepted[]>(() => (demo === "results" ? [sampleAccepted()] : []));
  const [adding, setAdding] = React.useState(false);
  const [reviewSignal, setReviewSignal] = React.useState(0);
  const [fullReport, setFullReport] = React.useState(demo === "results");
  const nextId = React.useRef(demo === "results" ? 2 : 1);
  const [pending, setPending] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [mapping, setMapping] = React.useState<Mapping | null>(() => (loaded ? (detectHeader(loaded.grid)?.mapping ?? {}) : null));
  const [headerRow, setHeaderRow] = React.useState(() => (loaded ? (detectHeader(loaded.grid)?.row ?? 0) : 0));
  const [rules, setRules] = React.useState<UserRule[]>([]);
  const [edits, setEdits] = React.useState<UserEdit[]>([]);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setLoaded(null);
    setPending(null);
    setPassword("");
    setProblem(null);
    setMapping(null);
    setFiles([]);
    setAdding(false);
    setRules([]);
    setEdits([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const accept = (name: string, kind: string, grid: string[][], lines?: string[], sample = false) => {
    const header = detectHeader(grid);
    setLoaded({ name, kind, grid, lines, sample });
    setHeaderRow(header?.row ?? 0);
    setMapping(header?.mapping ?? {});
    setPending(null);
    setPassword("");
    setProblem(header ? null : statementCopy.noHeader);
  };

  const open = async (file: File, pdfPassword?: string) => {
    setBusy(true);
    setProblem(null);
    setRules([]);
    setEdits([]);
    try {
      if (!pdfPassword) logEvent("statement_file_chosen"); // a password retry is the same file
      const { readStatement } = await import("@/lib/statement/read-file");
      const result: ReadResult = await readStatement(file, pdfPassword);
      if (result.ok) accept(file.name, result.kind, result.grid, result.lines);
      else {
        if (result.reason === "password" || result.reason === "excel-password" || result.reason === "wrong-password") setPending(file);
        setProblem(statementCopy.reasons[result.reason]);
      }
    } finally {
      setBusy(false);
    }
  };

  const header: Header | null = React.useMemo(
    () => (loaded && mapping ? { row: headerRow, mapping, labels: loaded.grid[headerRow] ?? [] } : null),
    [loaded, mapping, headerRow],
  );
  const opening = React.useMemo(
    () => (loaded ? findOpeningBalance([...(loaded.lines ?? []), ...loaded.grid.slice(0, 80).map((r) => r.join(" "))]) : null),
    [loaded],
  );
  const tableExtraction = React.useMemo(() => {
    if (!loaded || !header) return null;
    const ex = extractTransactions(loaded.grid, header);
    return { ...ex, txns: reconcileWithBalance(ex.txns, opening).txns };
  }, [loaded, header, opening]);
  // PDFs can also be read line by line (UPI app statements, and bank PDFs without a clean table).
  const lineExtraction = React.useMemo(() => (loaded?.lines ? transactionsFromLines(loaded.lines) : null), [loaded]);
  const tableCheck = React.useMemo(() => (tableExtraction ? balanceCheck(tableExtraction.txns, opening) : null), [tableExtraction, opening]);
  const lineCheck = React.useMemo(() => (lineExtraction ? balanceCheck(lineExtraction.txns, opening) : null), [lineExtraction, opening]);
  /**
   * Which reading to use: the table, unless it is empty or its balances do not add up while
   * the line-by-line reading's do. A PDF must either pass the balance check, or be a UPI
   * app statement with a +/− on every payment; anything else is refused (see below).
   */
  const byLines = Boolean(
    lineExtraction?.txns.length &&
      (!tableExtraction?.txns.length || (!tableCheck?.ok && (lineCheck?.ok || (!tableCheck?.hasBalances && lineExtraction.method === "signed")))),
  );
  const extraction = React.useMemo(
    () => (byLines && lineExtraction ? { ...lineExtraction, order: "dmy" as const } : tableExtraction),
    [byLines, lineExtraction, tableExtraction],
  );
  const check = byLines ? lineCheck : tableCheck;
  const appStatement = byLines && lineExtraction?.method === "signed" && !check?.hasBalances;
  const pdfRefused = loaded?.kind === "pdf" && Boolean(extraction?.txns.length) && !check?.ok && !appStatement;
  // Only a confirmed, verified reading reaches the engine; all totals come from its facts.
  // Every accepted statement passed its own checks; the engine sees them together and drops overlaps.
  const engine = React.useMemo(() => {
    if (!files.length) return null;
    const context: StatementContext = {
      holderNames: [...new Set(files.flatMap((f) => f.context.holderNames))],
      familyNames: [...new Set(files.flatMap((f) => f.context.familyNames))],
    };
    return runEngine(files.flatMap((f) => f.raw), rules, edits, context);
  }, [files, rules, edits]);
  const acceptCurrent = () => {
    if (!loaded || !extraction?.txns.length) return;
    const id = `file${nextId.current}`;
    nextId.current += 1;
    const txns = extraction.txns;
    setFiles((list) => [
      ...list,
      { id, sample: loaded.sample, name: loaded.name, raw: toRaw(txns, id), checked: check?.ok ? check.matched : null, app: appStatement, from: txns[0]!.date, to: txns[txns.length - 1]!.date, context: readStatementContext(headerTexts(loaded)) },
    ]);
    setLoaded(null);
    setMapping(null);
    setAdding(false);
    if (inputRef.current) inputRef.current.value = "";
  };
  const removeFile = (id: string) => setFiles((list) => list.filter((f) => f.id !== id));
  const facts = engine?.facts ?? null;
  const editTxn = (txnId: string, type: TxnType, category: string) =>
    setEdits((list) => [...list.filter((e) => e.txnId !== txnId), { txnId, set: { type, category, kind: kindFor(type, category) } }]);
  const addRule = (counterparty: string, type: TxnType, category: string) =>
    setRules((list) => [...list.filter((r) => r.counterparty !== counterparty), { id: `${counterparty}-${Date.now()}`, counterparty, set: { type, category, kind: kindFor(type, category) } }]);
  const removeRule = (id: string) => setRules((list) => list.filter((r) => r.id !== id));

  const copyReport = async () => {
    if (!loaded) return;
    const table = problemReport(loaded.kind, loaded.grid, header, tableExtraction);
    const text = loaded.lines ? `${table}\n--- PDF lines ---\n${lineReport(loaded.lines, lineExtraction ?? transactionsFromLines(loaded.lines))}` : table;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = async (kind: "xlsx" | "pdf") => {
    if (!facts || !engine) return;
    setBusy(true);
    try {
      const mod = await import("@/lib/statement/export");
      const blob =
        kind === "xlsx"
          ? await mod.statementXlsx(facts, engine.txns, statementCopy.exportNote, engine.insights)
          : await mod.statementPdf(facts, statementCopy.exportNote, engine.insights);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `money-report_${facts.period.from}_to_${facts.period.to}.${kind}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Step 1: choose a file ----------
  if (!loaded && (files.length === 0 || adding)) {
    return (
      <div className="space-y-4">
        {files.length ? (
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm">
            <span className="text-muted">
              Adding to {files.length} {files.length === 1 ? "statement" : "statements"}: {files.map((f) => f.name).join(", ")}
            </span>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Back to the report
            </Button>
          </div>
        ) : null}
        <div className="glass rounded-2xl p-5 sm:p-8">
          <p className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-[0.9375rem] leading-relaxed">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-soft" />
            <span>
              {statementCopy.privacy}
              <span className="mt-1 block text-sm text-muted">{statementCopy.privacyHinglish}</span>
            </span>
          </p>
          <label
            htmlFor="statement-file"
            className="mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 px-6 py-10 text-center transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary"
          >
            <FileUp aria-hidden="true" className="size-8 text-primary-soft" />
            <span className="text-[1.0625rem] font-medium text-foreground">{busy ? "Reading your file…" : "Choose your statement"}</span>
            <span className="text-sm text-muted">{statementCopy.formats}</span>
            <input
              ref={inputRef}
              id="statement-file"
              type="file"
              accept=".csv,.txt,.xls,.xlsx,.pdf,text/csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void open(f);
              }}
            />
          </label>
          {pending ? (
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void open(pending, password);
              }}
            >
              <label htmlFor="pdf-password" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock aria-hidden="true" className="size-4" /> File password
              </label>
              <div className="flex gap-2">
                <input
                  id="pdf-password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-background/60 px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" disabled={busy || password === ""}>
                  {busy ? "Opening…" : "Open"}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-dim">{statementCopy.passwordHint}</p>
            </form>
          ) : null}
          {problem ? (
            <p role="alert" className="mt-4 text-sm text-warning">
              {problem}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
            <Button type="button" variant="secondary" onClick={() => accept("sample-statement.csv", "csv", parseDelimited(SAMPLE_CSV), undefined, true)}>
              Try a sample statement
            </Button>
            <span className="text-sm text-muted">Made-up data, to see how it works.</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Step 2: check what was read ----------
  if (loaded) {
  const columnOptions = (loaded.grid[headerRow] ?? []).map((label, i) => ({ value: String(i), label: label || `Column ${i + 1}` }));
  const txns = extraction?.txns ?? [];
  {
    return (
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[1.125rem] font-semibold">Check what we read</h2>
            <span className="text-sm text-muted">{loaded.name}</span>
          </div>
          <p className="mt-1.5 text-[0.9375rem] text-muted">{statementCopy.reviewHelp}</p>
          {problem && !byLines && !txns.length ? <p className="mt-3 text-sm text-warning">{problem}</p> : null}
          {byLines ? (
            <p className="mt-3 text-sm text-muted">This PDF is not laid out as a table, so it was read line by line: each entry starts at a date, and the amount and direction come from its text.</p>
          ) : null}
          <p className="mt-4 text-[0.9375rem]">
            <span className="font-semibold text-foreground">{txns.length} transactions</span>
            {txns.length ? ` from ${shortDate(txns[0]!.date)} to ${shortDate(txns[txns.length - 1]!.date)}` : ""}
            {extraction?.skipped ? (
              <span className="text-muted">
                {" "}
                · {extraction.skipped} other {extraction.skipped === 1 ? "row" : "rows"} ignored (totals, page headers)
              </span>
            ) : null}
          </p>

          {txns.length && check?.ok ? (
            <p role="status" className="mt-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm">
              ✓ {statementCopy.checkedOk(check.matched)}
            </p>
          ) : null}
          {txns.length && pdfRefused ? (
            <div role="alert" className="mt-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-[0.9375rem] leading-relaxed">
              <p className="font-medium text-foreground">{statementCopy.pdfRefused}</p>
              <p className="mt-1 text-sm text-muted">{statementCopy.pdfRefusedHinglish}</p>
              {check?.hasBalances ? <p className="mt-1 text-xs text-muted-dim">{statementCopy.mismatch(check.checked - check.matched, check.checked)}</p> : null}
            </div>
          ) : null}
          {txns.length && !pdfRefused && check?.hasBalances && !check.ok ? (
            <p role="alert" className="mt-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm">
              {statementCopy.mismatch(check.checked - check.matched, check.checked)} {statementCopy.mismatchHelp}
            </p>
          ) : null}
          {txns.length && appStatement ? <p className="mt-3 text-xs leading-relaxed text-muted-dim">{statementCopy.appNote}</p> : null}
          <details className={cn("mt-4 rounded-xl border border-white/10 px-4 py-3", byLines && "hidden")} open={!txns.length}>
            <summary className="cursor-pointer text-sm font-medium text-foreground">Columns used</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Header row</span>
                <select
                  value={headerRow}
                  onChange={(e) => {
                    const row = Number(e.target.value);
                    setHeaderRow(row);
                    setMapping(mappingForRow(loaded.grid[row] ?? []));
                  }}
                  className="w-full rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-foreground"
                >
                  {loaded.grid.slice(0, 60).map((row, i) => (
                    <option key={i} value={i}>
                      Row {i + 1}: {row.filter(Boolean).slice(0, 4).join(" | ").slice(0, 60)}
                    </option>
                  ))}
                </select>
              </label>
              {FIELDS.map((f) => (
                <label key={f} className="text-sm">
                  <span className="mb-1 block text-muted">{FIELD_LABELS[f]}</span>
                  <select
                    value={mapping?.[f] === undefined ? "" : String(mapping[f])}
                    onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                    className="w-full rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-foreground"
                  >
                    <option value="">— none —</option>
                    {columnOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </details>

          {txns.length ? (
            <div className="mt-4 overflow-x-auto" role="region" aria-label="First transactions read" tabIndex={0}>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs text-muted-dim">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Description</th>
                    <th className="py-2 pr-3 text-right font-medium">Out</th>
                    <th className="py-2 text-right font-medium">In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {txns.slice(0, 8).map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap py-2 pr-3 tabular-nums">{shortDate(t.date)}</td>
                      <td className="max-w-[18rem] truncate py-2 pr-3 text-muted">{t.narration}</td>
                      <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">{t.debit ? rupees(t.debit) : ""}</td>
                      <td className="whitespace-nowrap py-2 text-right tabular-nums">{t.credit ? rupees(t.credit) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" disabled={!txns.length || pdfRefused} onClick={acceptCurrent}>
              Looks right — show the analysis
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => {
                setLoaded(null);
                setMapping(null);
                if (files.length) setAdding(true);
                else reset();
              }}
            >
              Choose another file
            </Button>
          </div>
          <div className="mt-5 border-t border-hairline pt-4">
            <button type="button" onClick={copyReport} className="rounded-md text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {copied ? "Problem report copied" : "Not right? Copy a problem report"}
            </button>
            <p className="mt-1 text-xs leading-relaxed text-muted-dim">{statementCopy.reportHelp}</p>
          </div>
        </div>
      </div>
    );
  }

  }

  // ---------- Step 3: the money report ----------
  if (!facts || !engine) return null;
  const allChecked = files.every((f) => f.checked !== null);
  const reportCheck = allChecked ? { ok: true, matched: files.reduce((n, f) => n + (f.checked ?? 0), 0) } : null;
  return (
    <div className="space-y-4">
      {engine.insights ? (
        <MoneyReview
          facts={facts}
          insights={engine.insights}
          txns={engine.txns}
          onAnswer={addRule}
          measure={files.some((f) => !f.sample)}
          onSomethingElse={() => {
            setFullReport(true);
            setTimeout(() => document.getElementById("all-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
          }}
        />
      ) : null}
      <section className="glass rounded-2xl p-5 sm:p-7" aria-labelledby="files-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="files-heading" className="text-[1.0625rem] font-semibold">
            {files.length === 1 ? "Your statement" : `Your ${files.length} statements`}
          </h2>
          <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
            Add another statement
          </Button>
        </div>
        <ul className="mt-3 divide-y divide-hairline text-sm">
          {files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
              <span className="min-w-0 truncate text-foreground">{f.name}</span>
              <span className="flex items-baseline gap-3 text-xs text-muted">
                {f.from.split("-").reverse().join("-")} to {f.to.split("-").reverse().join("-")} · {f.raw.length} entries · {f.checked !== null ? "✓ balances checked" : f.app ? "UPI app statement" : "not balance-checked"}
                {files.length > 1 ? (
                  <button type="button" aria-label={`Remove ${f.name}`} onClick={() => removeFile(f.id)} className="rounded-sm text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    Remove
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        {files.length > 1 ? <p className="mt-2 text-xs text-muted-dim">{statementCopy.multiNote(facts.duplicatesExcluded)}</p> : <p className="mt-2 text-xs text-muted-dim">{statementCopy.addHint}</p>}
      </section>
      {!fullReport ? (
        <div className="flex justify-center">
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={() => {
              setFullReport(true);
              logEvent("review_full_report_opened");
            }}
          >
            See the full report
          </Button>
        </div>
      ) : null}
      {fullReport && engine.insights ? (
        <MoneyReport
          facts={facts}
          insights={engine.insights}
          txns={engine.txns}
          check={reportCheck}
          appStatement={files.some((f) => f.app)}
          fileName={files.length === 1 ? files[0]!.name : `${files.length} statements`}
          onReview={() => {
            setFullReport(true);
            setReviewSignal((n) => n + 1);
            document.getElementById("all-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      ) : null}
      {fullReport ? <Transactions reviewSignal={reviewSignal} txns={engine.txns} onEdit={editTxn} rules={rules} onAddRule={addRule} onRemoveRule={removeRule} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="lg" onClick={() => download("pdf")} disabled={busy}>
          <Download aria-hidden="true" className="size-4" /> Summary PDF
        </Button>
        <Button type="button" size="lg" variant="secondary" onClick={() => download("xlsx")} disabled={busy}>
          <FileSpreadsheet aria-hidden="true" className="size-4" /> Excel with all transactions
        </Button>
        <Button type="button" size="lg" variant="ghost" onClick={reset}>
          <RotateCcw aria-hidden="true" className="size-4" /> Start over
        </Button>
      </div>
      <div className="glass rounded-2xl p-5 text-[0.9375rem] leading-relaxed sm:p-7">
        <p className="text-foreground">{statementCopy.appCta}</p>
        <p className="mt-1 text-sm text-muted">{statementCopy.appCtaHinglish}</p>
        <a href={joinBetaHref} className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Join the beta
        </a>
      </div>
      <p className="text-sm text-muted">{statementCopy.privacy}</p>
    </div>
  );
}
