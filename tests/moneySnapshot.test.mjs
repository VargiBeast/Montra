import test from "node:test";
import assert from "node:assert/strict";
import { rangeForPeriod, filterTransactions, summarize } from "../src/lib/analytics.ts";

test("this_month boundaries local calendar", () => {
  const range = rangeForPeriod("this_month", undefined, new Date("2026-10-16T12:00:00"));
  assert.equal(range.start, "2026-10-01");
  assert.equal(range.end, "2026-10-31");
});

test("snapshot month filters prior months out", () => {
  const range = rangeForPeriod("this_month", undefined, new Date("2026-10-16"));
  const txs = [
    { id: "1", type: "in", amount: 100, date: "2026-10-05", method: "a", name: "a" },
    { id: "2", type: "out", amount: 30, date: "2026-09-20", method: "a", name: "b" },
  ];
  const s = summarize(filterTransactions(txs, range, "all", null));
  assert.equal(s.totalIncome, 100);
  assert.equal(s.totalSpending, 0);
  assert.equal(s.netChange, 100);
});
