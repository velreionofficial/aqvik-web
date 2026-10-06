import { applyUserDecisions, classifyOne } from "./classify.ts";
import { computeFacts, type FinancialFacts } from "./facts.ts";
import { buildInsights, type Insights } from "./insights.ts";
import type { StatementContext } from "./context.ts";
import { linkRefunds, markDuplicates, markHolderAndFamily, markRegularIncome, markRoundTrips } from "./links.ts";
import type { ClassifiedTxn, RawTxn, UserEdit, UserRule } from "./model.ts";

/**
 * The whole engine: classify each line, add cross-transaction evidence, then
 * apply the user's decisions last (they always win), then compute facts.
 */
export function runEngine(
  raw: RawTxn[],
  rules: UserRule[] = [],
  edits: UserEdit[] = [],
  context: StatementContext = { holderNames: [], familyNames: [] },
): { txns: ClassifiedTxn[]; facts: FinancialFacts | null; insights: Insights | null } {
  let txns: ClassifiedTxn[] = raw.map((t) => ({ ...t, c: classifyOne(t) }));
  txns = markDuplicates(txns);
  txns = linkRefunds(txns);
  txns = markRegularIncome(txns);
  txns = markRoundTrips(txns);
  txns = markHolderAndFamily(txns, context);
  txns = txns.map((t) => ({ ...t, c: applyUserDecisions(t.c, t, rules, edits) }));
  const facts = computeFacts(txns);
  return { txns, facts, insights: facts ? buildInsights(facts, txns) : null };
}

export * from "./model.ts";
export type { FinancialFacts, MonthFacts, RecurringFact, SubscriptionFact, Trends } from "./facts.ts";
export type { HealthItem, Insight, Insights, StoryLine } from "./insights.ts";
export { toRaw } from "./links.ts";
export { readStatementContext, type StatementContext } from "./context.ts";
export { queryTransactions, type QueryResult, type TxnQuery } from "./query.ts";
export { fits } from "./classify.ts";
