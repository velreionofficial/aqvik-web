import { test } from "node:test";
import assert from "node:assert/strict";

import { nameMatches, readStatementContext } from "./context.ts";
import { runEngine, type RawTxn } from "./index.ts";

/** Made-up SBI-style lines: names cut to 8 letters, UPI IDs broken by spaces. */
let n = 0;
const t = (date: string, description: string, debit: number, credit = 0): RawTxn => ({ id: `s:${(n += 1)}`, sourceFileId: "s", date, description, debit, credit, balance: null });

test("Statement header: account holder and care-of names", () => {
  const ctx = readStatementContext(["Mr. Amit  Verma\nNo 12 Some Road", "C/O: Suresh Kumar Verma, Patna", "Account Number : 00000000000"]);
  assert.deepEqual(ctx, { holderNames: ["AMIT VERMA"], familyNames: ["SURESH KUMAR VERMA"] });
  assert.equal(nameMatches("SURESH K", "SURESH KUMAR VERMA"), true);
  assert.equal(nameMatches("AMIT", "AMIT VERMA"), false); // under 5 letters is too weak
  assert.equal(nameMatches("AMITABH", "AMIT VERMA"), false);
});

test("Names cut short and UPI IDs broken by spaces still match known platforms", () => {
  const r = runEngine([
    t("2026-07-01", "WDL TFR UPI/DR/412300000001/PAYTM MO/ICIC/pay tmmoney/1111 AT 10771 TOWN", 5000_00),
    t("2026-07-02", "WDL TFR UPI/DR/412300000002/APPLE ME/HDFC/app leservi/Exec AT 10771 TOWN", 129_00),
    t("2026-07-03", "DEP TFR NEFT*UTIB0000007*ANGEL ONE LIM ITED AT 10771", 0, 67_97),
  ]);
  assert.deepEqual(r.txns.map((x) => [x.c.type, x.c.category]), [
    ["TRANSFER", "Broker funding"],
    ["SPENDING", "Subscriptions"],
    ["TRANSFER", "From investment platform"],
  ]);
});

test("Own account needs the holder's name AND money both ways; care-of name means Family", () => {
  const ctx = { holderNames: ["AMIT VERMA"], familyNames: ["SURESH KUMAR VERMA"] };
  const both = ["2026-07-01", "2026-07-10", "2026-07-20"].flatMap((d, i) => [
    t(d, `WDL TFR UPI/DR/41230000010${i}/AMIT VER/BKID/11 22/NA AT 10771`, 500_00),
    t(d, `DEP TFR UPI/CR/41230000020${i}/AMIT VER/BKID/11 22/NA AT 10771`, 0, 800_00),
  ]);
  const oneWay = [t("2026-07-05", "WDL TFR UPI/DR/412300000301/AMIT VER/BKID/11 22/NA", 900_00)];
  const family = [t("2026-07-07", "DEP TFR UPI/CR/412300000401/SURESH K/SBIN/33 44/Sent AT 10771", 0, 28000_00)];
  const r1 = runEngine([...both, ...family], [], [], ctx);
  assert.ok(r1.txns.slice(0, 6).every((x) => x.c.category === "Own accounts" && x.c.counterparty.kind === "own" && x.c.confidence < 0.8));
  assert.equal(r1.txns[6]!.c.category, "Family");
  assert.equal(r1.txns[6]!.c.type, "TRANSFER");
  // The same name with money going one way only is not enough for "own account".
  const r2 = runEngine(oneWay, [], [], ctx);
  assert.equal(r2.txns[0]!.c.category, "To people");
  // Without a header, nothing changes.
  assert.equal(runEngine(both).txns[0]!.c.category, "To people");
});

test("A user's choice still wins over the header signals", () => {
  const ctx = { holderNames: ["AMIT VERMA"], familyNames: [] };
  const lines = ["2026-07-01", "2026-07-10"].flatMap((d, i) => [t(d, `WDL TFR UPI/DR/5${i}/AMIT VER/BKID/x/NA`, 100_00), t(d, `DEP TFR UPI/CR/6${i}/AMIT VER/BKID/x/NA`, 0, 100_00)]);
  const r = runEngine(lines, [{ id: "r", counterparty: "AMIT VER", set: { type: "TRANSFER", category: "Friend", kind: "person" } }], [], ctx);
  assert.ok(r.txns.every((x) => x.c.category === "Friend" && x.c.layer === "user-rule"));
});

test("A ₹1 credit from a lender is an account check, not a loan", () => {
  const r = runEngine([t("2026-07-01", "DEP TFR IMPS/412300000001/ybp-XX01-CASHFREE/Snapmint 12345", 0, 1_00), t("2026-07-02", "DEP TFR IMPS/412300000002/Snapmint loan disbursal", 0, 20000_00)]);
  assert.deepEqual(r.txns.map((x) => x.c.category), ["Account verification", "Loan received"]);
});
