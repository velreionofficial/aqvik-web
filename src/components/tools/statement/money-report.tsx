"use client";

import * as React from "react";

import { statementCopy } from "@/content/statement-analyzer";
import { IN_CHOICES, OUT_CHOICES, TYPE_LABEL, kindFor } from "@/lib/statement/engine/catalog";
import type { Bucket, ClassifiedTxn, FinancialFacts, Insight, Insights, TxnType, UserRule } from "@/lib/statement/engine";
import { maskText } from "@/lib/statement/mask";
import { cn } from "@/lib/utils";

/**
 * The report. It only displays FinancialFacts and classified transactions; it
 * never adds money up itself.
 */

export const rupees = (paise: number) =>
  `${paise < 0 ? "−" : ""}₹${(Math.abs(paise) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const short = (paise: number) => {
  const r = Math.abs(paise) / 100;
  const s = r >= 1e7 ? `${(r / 1e7).toFixed(2)} Cr` : r >= 1e5 ? `${(r / 1e5).toFixed(2)} L` : r.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return `${paise < 0 ? "−" : ""}₹${s}`;
};
const dmy = (iso: string) => iso.split("-").reverse().join("-");
const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part * 100) / whole)}%` : "0%");
const FREQ = { weekly: "weekly", monthly: "monthly", quarterly: "every 3 months", yearly: "yearly" } as const;
const bandLabel = (c: number) => (c >= 0.8 ? "High" : c >= 0.5 ? "Medium" : "Low");

type Check = { ok: boolean; matched: number } | null;

function Tile({ label, value, sub, strong }: { label: string; value: number; sub?: string; strong?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-white/10 p-4", strong && "border-primary/30 bg-primary/5")}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={cn("mt-1 font-semibold tabular-nums text-foreground", strong ? "text-xl sm:text-2xl" : "text-lg")}>{rupees(value)}</dd>
      {sub ? <dd className="mt-1 text-xs leading-relaxed text-muted-dim">{sub}</dd> : null}
    </div>
  );
}

function Bars({ items, total, empty }: { items: Bucket[]; total: number; empty: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-muted">{empty}</p>;
  return (
    <ul className="mt-4 space-y-3">
      {items.map((b) => (
        <li key={b.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-foreground">
              {b.key}
              <span className="ml-1.5 text-xs text-muted-dim">× {b.count}</span>
            </span>
            <span className="tabular-nums text-muted">
              {rupees(b.amount)} · {pct(b.amount, total)}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-white/5" aria-hidden="true">
            <div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${total ? (b.amount / total) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function List({ items, empty }: { items: Bucket[]; empty: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-muted">{empty}</p>;
  return (
    <ul className="mt-3 divide-y divide-hairline">
      {items.map((b) => (
        <li key={b.key} className="flex items-baseline justify-between gap-3 py-2 text-sm">
          <span className="min-w-0 truncate text-foreground">
            {b.key}
            <span className="ml-1.5 text-xs text-muted-dim">× {b.count} · avg {short(Math.round(b.amount / b.count))}</span>
          </span>
          <span className="shrink-0 tabular-nums text-muted">{rupees(b.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

function PartsBox({ title, lead, parts, total }: { title: string; lead: string; parts: { label: string; amount: number }[]; total: number }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-[0.9375rem] leading-relaxed">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted">{lead}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex justify-between gap-3">
            <span className="text-muted">{p.label}</span>
            <span className="tabular-nums text-foreground">
              {rupees(p.amount)} · {pct(p.amount, total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Card = ({ title, note, children, id }: { title: string; note?: string; children: React.ReactNode; id: string }) => (
  <section className="glass min-w-0 rounded-2xl p-5 sm:p-7" aria-labelledby={id}>
    <h2 id={id} className="text-[1.0625rem] font-semibold">
      {title}
    </h2>
    {note ? <p className="mt-1 text-xs leading-relaxed text-muted-dim">{note}</p> : null}
    {children}
  </section>
);

const LEVEL_TEXT = { review: "Worth a look", watch: "Keep an eye", info: "For your information" } as const;
const HEALTH_TEXT = { good: "Looks fine", watch: "Keep an eye", review: "Worth a look", unknown: "Not enough data" } as const;
const HEALTH_MARK = { good: "✓", watch: "!", review: "!!", unknown: "–" } as const;

function InsightRow({ item, txns }: { item: Insight; txns: Map<string, ClassifiedTxn> }) {
  const [open, setOpen] = React.useState(false);
  const rows = item.txnIds.map((id) => txns.get(id)).filter((t): t is ClassifiedTxn => Boolean(t));
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.9375rem] font-medium text-foreground">{item.title}</span>
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs", item.level === "review" ? "border-warning/50 text-warning" : "border-white/15 text-muted")}>{LEVEL_TEXT[item.level]}</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
      {rows.length ? (
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-1 rounded-sm text-xs text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          {open ? "Hide" : "View"} {rows.length} {rows.length === 1 ? "transaction" : "transactions"}
        </button>
      ) : null}
      {open ? (
        <ul className="mt-2 space-y-1 rounded-lg border border-white/10 p-2 text-xs">
          {rows.slice(0, 30).map((t) => (
            <li key={t.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-muted">
                {dmy(t.date)} · {t.c.counterparty.name}
              </span>
              <span className="shrink-0 tabular-nums text-foreground">{t.debit ? `−${rupees(t.debit)}` : `+${rupees(t.credit)}`}</span>
            </li>
          ))}
          {rows.length > 30 ? <li className="text-muted-dim">and {rows.length - 30} more</li> : null}
        </ul>
      ) : null}
    </li>
  );
}

export function MoneyReport({
  facts: f,
  insights,
  txns,
  check,
  appStatement,
  fileName,
}: {
  facts: FinancialFacts;
  insights: Insights;
  txns: ClassifiedTxn[];
  check: Check;
  appStatement: boolean;
  fileName: string;
}) {
  const byId = React.useMemo(() => new Map(txns.map((t) => [t.id, t])), [txns]);
  const rank = { review: 0, watch: 1, info: 2 } as const;
  const worth = [...insights.unusual, ...insights.leaks].sort((a, b) => rank[a.level] - rank[b.level] || (b.amount ?? 0) - (a.amount ?? 0));
  const changeOf = (month: string) => f.trends.changes.find((c) => c.month === month)?.spendingBp ?? null;
  const maxMonth = Math.max(1, ...f.monthly.map((m) => Math.max(m.income, m.spending, m.moneyIn, m.moneyOut)));
  const outgoing = f.recurring.filter((r) => r.direction === "out");
  const incoming = f.recurring.filter((r) => r.direction === "in");
  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-5 sm:p-7" aria-labelledby="report-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="report-heading" className="text-[1.25rem] font-semibold">
            Your money report
          </h2>
          <span className="text-sm text-muted">
            {dmy(f.period.from)} to {dmy(f.period.to)} · {f.count} transactions · {fileName}
          </span>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Tile strong label="Money in" value={f.raw.moneyIn} sub="Everything that came into your account." />
          <Tile strong label="Money out" value={f.raw.moneyOut} sub="Everything that left your account." />
          <Tile strong label="Net (in − out)" value={f.netCashFlow} sub={f.raw.openingBalance !== null && f.raw.closingBalance !== null ? `Balance ${rupees(f.raw.openingBalance)} → ${rupees(f.raw.closingBalance)}` : statementCopy.tiles.net} />
        </dl>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PartsBox title="Where money in came from" lead={`${rupees(f.raw.moneyIn)} came in:`} parts={f.moneyInParts} total={f.raw.moneyIn} />
          <PartsBox title="Money out ≠ spending" lead={`${rupees(f.raw.moneyOut)} went out. Only part of it was spending:`} parts={f.moneyOutParts} total={f.raw.moneyOut} />
        </div>

        <h3 className="mt-6 text-sm font-medium text-muted">What the money was</h3>
        <dl className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Tile strong label="True income" value={f.trueIncome} sub={statementCopy.tiles.income} />
          <Tile strong label="Actual spending" value={f.actualSpending} sub={f.refundsLinked ? `${rupees(f.grossSpending)} spent, ${rupees(f.refundsLinked)} refunded` : statementCopy.tiles.spending} />
          <Tile label="Investments" value={f.investmentsConfirmed} sub={f.brokerFunding ? `+ ${rupees(f.brokerFunding)} sent to investment platforms (not confirmed as invested)` : statementCopy.tiles.investments} />
          <Tile label="Debt payments" value={f.debtPayments} sub={statementCopy.tiles.debt} />
          <Tile label="Transfers out" value={f.transfersOut} sub={`${rupees(f.transfersIn)} came in as transfers`} />
          <Tile label="Cash withdrawals" value={f.cashWithdrawals} sub={statementCopy.tiles.cash} />
          <Tile label="Refunds" value={f.refundsLinked + f.refundsUnlinked} sub={f.cashback ? `+ ${rupees(f.cashback)} cashback` : statementCopy.tiles.refunds} />
          <Tile label="Fees & charges" value={f.fees} sub={f.interest ? `${rupees(f.interest)} interest received` : statementCopy.tiles.fees} />
        </dl>

        <p className="mt-4 text-sm text-muted">
          {f.duplicatesExcluded ? `${f.duplicatesExcluded} duplicate entries were left out. ` : ""}
        </p>
        {check?.ok ? <p className="mt-2 text-sm text-primary-soft">✓ {statementCopy.checkedOk(check.matched)}</p> : null}
        {appStatement ? <p className="mt-2 text-xs text-muted-dim">{statementCopy.appNote}</p> : null}
        {f.unknownOut || f.unknownIn ? (
          <p className="mt-2 text-sm text-muted">
            {statementCopy.unknownNote(rupees(f.unknownOut), rupees(f.unknownIn), f.lowConfidence)}
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card id="story-heading" title="What happened" note="Written from the numbers above; nothing here is estimated.">
          <ul className="mt-3 space-y-2 text-[0.9375rem] leading-relaxed text-foreground">
            {insights.story.map((l) => (
              <li key={l.id} className="flex gap-2">
                <span aria-hidden="true" className="text-primary-soft">•</span>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card id="health-heading" title="Health snapshot" note="Based on this statement only. Other accounts, cards and cash are not included.">
          <ul className="mt-3 divide-y divide-hairline">
            {insights.health.map((h) => (
              <li key={h.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block text-foreground">{h.label}</span>
                  <span className="block text-xs text-muted-dim">{h.explain}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block tabular-nums text-foreground">{h.value}</span>
                  <span className={cn("block text-xs", h.level === "review" ? "text-warning" : h.level === "good" ? "text-primary-soft" : "text-muted")}>
                    <span aria-hidden="true">{HEALTH_MARK[h.level]} </span>
                    {HEALTH_TEXT[h.level]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {insights.checklist.length ? (
        <Card id="checklist-heading" title="Before you rely on this report" note="Quick checks, worked out from your statement.">
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {insights.checklist.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span aria-hidden="true">☐</span>
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card id="worth-heading" title="Worth a look" note="Unusual activity and possible money leaks, worked out from this statement. Open any item to see the transactions behind it.">
        {worth.length ? (
          <ul className="mt-2 divide-y divide-hairline">
            {worth.map((i) => (
              <InsightRow key={i.id} item={i} txns={byId} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Nothing unusual stood out in this statement.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card id="spend-heading" title="Where your spending went" note={statementCopy.guessNote}>
          <Bars items={f.spendingByCategory} total={f.grossSpending} empty="No spending found." />
        </Card>
        <Card id="month-heading" title="Month by month" note="Money in and out as on your bank statement, with income and spending below each month.">
          {f.trends.avgMonthlySpending !== null ? (
            <p className="mt-3 text-sm text-muted">
              Average a month (full months): income {short(f.trends.avgMonthlyIncome ?? 0)} · spending {short(f.trends.avgMonthlySpending)}
              {f.trends.highestSpendingMonth ? ` · most spending in ${monthLabel(f.trends.highestSpendingMonth.month)}` : ""}
            </p>
          ) : null}
          <ul className="mt-4 space-y-4">
            {f.monthly.map((m) => (
              <li key={m.month}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="text-foreground">{monthLabel(m.month)}</span>
                  <span className="tabular-nums text-muted">
                    in {short(m.moneyIn)} · out {short(m.moneyOut)}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1" aria-hidden="true">
                  <div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${(m.moneyIn / maxMonth) * 100}%` }} />
                  <div className="h-1.5 rounded-full bg-[#6366F1]/70" style={{ width: `${(m.moneyOut / maxMonth) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-dim">
                  Income {short(m.income)} · spending {short(m.spending)}
                  {m.partial ? " · part of the month only" : changeOf(m.month) !== null ? ` · spending ${changeOf(m.month)! >= 0 ? "up" : "down"} ${Math.round(Math.abs(changeOf(m.month)!) / 100)}% on the month before` : ""}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex gap-4 text-xs text-muted-dim">
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-primary/70" />
              Money in
            </span>
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-[#6366F1]/70" />
              Money out
            </span>
          </p>
        </Card>

        <Card id="rest-heading" title="Where the rest went" note="Money that left your account but was not spending.">
          <List
            items={[
              ...f.transfersOutByCategory.map((b) => ({ ...b, key: `Transfer · ${b.key}` })),
              ...f.investmentsByCategory.map((b) => ({ ...b, key: `Investment · ${b.key}` })),
              ...f.debtByCategory.map((b) => ({ ...b, key: `Debt · ${b.key}` })),
            ].sort((a, b) => b.amount - a.amount)}
            empty="Nothing here."
          />
        </Card>
        <Card id="recurring-heading" title="Regular payments" note={statementCopy.recurringNote}>
          {f.commitments.monthly ? (
            <p className="mt-3 text-[0.9375rem] text-foreground">
              ≈ {rupees(f.commitments.monthly)} a month · ≈ {short(f.commitments.annual)} a year
              {f.commitments.shareOfIncomeBp !== null ? <span className="text-muted"> · {Math.round(f.commitments.shareOfIncomeBp / 100)}% of income</span> : null}
            </p>
          ) : null}
          {outgoing.length ? (
            <ul className="mt-3 divide-y divide-hairline">
              {outgoing.map((r) => (
                <li key={r.counterparty + r.frequency} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{r.counterparty}</span>
                    <span className="block text-xs text-muted-dim">
                      {r.kind} · {FREQ[r.frequency]} · last {dmy(r.last)} · next around {dmy(r.nextEstimate)} (estimate)
                    </span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block text-foreground">{rupees(r.typical)}</span>
                    <span className="block text-xs text-muted-dim">≈ {short(r.annualized)}/year</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No regular payments found. A statement of 3 months or more finds more.</p>
          )}
        </Card>

        <Card id="subs-heading" title="Subscriptions" note={statementCopy.subscriptionNote}>
          {f.subscriptions.length ? (
            <ul className="mt-3 divide-y divide-hairline">
              {f.subscriptions.map((s) => (
                <li key={s.counterparty} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{s.counterparty}</span>
                    <span className="block text-xs text-muted-dim">
                      {s.frequency === "seen once" || s.frequency === "irregular" ? s.frequency : FREQ[s.frequency]} · last {dmy(s.last)} · Review this subscription
                    </span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block text-foreground">{rupees(s.typical)}</span>
                    <span className="block text-xs text-muted-dim">{s.monthlyEquivalent !== null && s.annualized !== null ? `≈ ${rupees(s.monthlyEquivalent)}/month · ${short(s.annualized)}/year` : "yearly cost unknown"}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No subscriptions found.</p>
          )}
        </Card>

        <Card id="fees-heading" title="Bank & financial charges" note={statementCopy.feesNote}>
          <p className="mt-3 text-[0.9375rem] text-foreground">
            {rupees(f.fees)} <span className="text-muted">in {f.feeTxnIds.length} {f.feeTxnIds.length === 1 ? "charge" : "charges"}</span>
          </p>
          <List items={f.feesByCategory} empty="No bank charges found in this period." />
        </Card>

        <Card id="income-heading" title="Comes in regularly" note="Money received from the same payer at a steady interval.">
          {incoming.length ? (
            <ul className="mt-3 divide-y divide-hairline">
              {incoming.map((r) => (
                <li key={r.counterparty + r.frequency} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{r.counterparty}</span>
                    <span className="block text-xs text-muted-dim">
                      {TYPE_LABEL[r.type]} · {r.category} · {FREQ[r.frequency]} · {r.occurrences} times
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground">{rupees(r.typical)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Nothing comes in at a steady interval in this period.</p>
          )}
        </Card>

        <Card id="merchants-heading" title="Top merchants" note="Where your spending went, by merchant.">
          <List items={f.topMerchants} empty="No merchants identified." />
        </Card>
        <Card id="people-heading" title="People" note="UPI payments to and from individuals. Some may be small shops using a personal UPI ID.">
          <h3 className="mt-3 text-sm font-medium text-foreground">Sent to</h3>
          <List items={f.topPeopleOut} empty="No payments to people." />
          <h3 className="mt-4 text-sm font-medium text-foreground">Received from</h3>
          <List items={f.topPeopleIn} empty="No money from people." />
        </Card>
      </div>
    </div>
  );
}

const enc = (type: TxnType, category: string) => `${type}|${category}`;

export function Transactions({
  txns,
  onEdit,
  rules,
  onAddRule,
  onRemoveRule,
}: {
  txns: ClassifiedTxn[];
  onEdit: (txnId: string, type: TxnType, category: string) => void;
  rules: UserRule[];
  onAddRule: (counterparty: string, type: TxnType, category: string) => void;
  onRemoveRule: (id: string) => void;
}) {
  const [filter, setFilter] = React.useState<"all" | "review" | TxnType>("all");
  const [showAll, setShowAll] = React.useState(false);
  const [offer, setOffer] = React.useState<{ counterparty: string; type: TxnType; category: string; count: number } | null>(null);
  const [reveal, setReveal] = React.useState(false);
  const show = (text: string) => (reveal ? text : maskText(text));
  const live = txns.filter((t) => !t.c.duplicateOf);
  const filtered = live.filter((t) => (filter === "all" ? true : filter === "review" ? t.c.confidence < 0.5 : t.c.type === filter));
  const visible = showAll ? filtered : filtered.slice(0, 50);
  const review = live.filter((t) => t.c.confidence < 0.5).length;

  return (
    <section className="glass rounded-2xl p-5 sm:p-7" aria-labelledby="all-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="all-heading" className="text-[1.0625rem] font-semibold">
          All transactions
        </h2>
        <label className="text-sm text-muted">
          <span className="sr-only">Show</span>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter);
              setShowAll(false);
            }}
            className="rounded-lg border border-white/10 bg-background/60 px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">All ({live.length})</option>
            <option value="review">Needs review ({review})</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-1 text-xs text-muted-dim">{statementCopy.editNote}</p>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} className="accent-[#22D3EE]" />
        Show full descriptions (account numbers and UPI IDs are hidden by default)
      </label>

      {offer ? (
        <div role="status" className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm">
          <span>
            Use “{TYPE_LABEL[offer.type]} · {offer.category}” for all {offer.count} transactions with {offer.counterparty}?
          </span>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1 text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              onAddRule(offer.counterparty, offer.type, offer.category);
              setOffer(null);
            }}
          >
            Apply to all
          </button>
          <button type="button" className="rounded-md px-2 py-1 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setOffer(null)}>
            Just this one
          </button>
        </div>
      ) : null}

      {rules.length ? (
        <div className="mt-3 text-sm">
          <span className="text-muted">Your rules: </span>
          {rules.map((r) => (
            <span key={r.id} className="mr-2 inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 text-xs">
              {r.counterparty} → {TYPE_LABEL[r.set.type]} · {r.set.category}
              <button type="button" aria-label={`Remove rule for ${r.counterparty}`} className="ml-1 text-muted hover:text-foreground" onClick={() => onRemoveRule(r.id)}>
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <ul className="mt-4 divide-y divide-hairline">
        {visible.map((t) => {
          const out = t.debit > 0;
          const choices = out ? OUT_CHOICES : IN_CHOICES;
          const current = enc(t.c.type, t.c.category);
          const known = choices.some((g) => g.type === t.c.type && g.categories.includes(t.c.category));
          return (
            <li key={t.id} className="grid gap-2 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_14rem_8rem] sm:items-start sm:gap-3">
              <span className="text-sm tabular-nums text-muted">{dmy(t.date)}</span>
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] text-foreground">{t.c.counterparty.name}</span>
                <span className="block truncate text-xs text-muted-dim" title={show(t.description)}>
                  {show(t.description)}
                </span>
                <span className="mt-0.5 block text-xs text-muted-dim">
                  {t.c.layer.startsWith("user") ? "Set by you" : `${bandLabel(t.c.confidence)} confidence`} · {t.c.reasons[0]}
                </span>
              </span>
              <select
                aria-label={`Type and category for ${t.c.counterparty.name} on ${dmy(t.date)}`}
                value={current}
                onChange={(e) => {
                  const [type, category] = e.target.value.split("|") as [TxnType, string];
                  onEdit(t.id, type, category);
                  const count = live.filter((x) => x.c.counterparty.name === t.c.counterparty.name && (x.debit > 0) === out).length;
                  if (count > 1 && t.c.counterparty.name !== "Unknown") setOffer({ counterparty: t.c.counterparty.name, type, category, count });
                }}
                className="w-full rounded-lg border border-white/10 bg-background/60 px-2 py-1.5 text-sm text-foreground"
              >
                {!known ? <option value={current}>{`${TYPE_LABEL[t.c.type]} · ${t.c.category}`}</option> : null}
                {choices.map((g) => (
                  <optgroup key={g.type} label={TYPE_LABEL[g.type]}>
                    {g.categories.map((cat) => (
                      <option key={cat} value={enc(g.type, cat)}>
                        {`${TYPE_LABEL[g.type]} · ${cat}`}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className={cn("text-right text-[0.9375rem] tabular-nums", out ? "text-muted" : "text-foreground")}>{out ? `−${rupees(t.debit)}` : `+${rupees(t.credit)}`}</span>
            </li>
          );
        })}
      </ul>
      {!showAll && filtered.length > 50 ? (
        <button type="button" onClick={() => setShowAll(true)} className="mt-3 rounded-md text-sm text-primary-soft hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Show all {filtered.length}
        </button>
      ) : null}
    </section>
  );
}

export { kindFor };
