import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  biggestExpenses,
  filterTransactions,
  previousRange,
  rangeForPeriod,
  spendingByCategory,
  summarize,
  timeBuckets,
  toIsoDate,
} from "../src/lib/analytics.ts";

const sample = [
  { id: "1", user_id: "u", type: "in", name: "Salary", amount: 10000, date: "2026-03-01", method: "Bank", link: null, note: null, image_url: null, created_at: "" },
  { id: "2", user_id: "u", type: "out", name: "Groceries", amount: 500, date: "2026-03-05", method: "Card", link: null, note: null, image_url: null, created_at: "" },
  { id: "3", user_id: "u", type: "out", name: "Rent", amount: 3000, date: "2026-03-02", method: "Bank", link: null, note: null, image_url: null, created_at: "" },
  { id: "4", user_id: "u", type: "out", name: "Coffee", amount: 80, date: "2026-02-20", method: "Card", link: null, note: null, image_url: null, created_at: "" },
];

describe("analytics", () => {
  it("builds this_month range without hardcoding", () => {
    const now = new Date(2026, 2, 15);
    const range = rangeForPeriod("this_month", undefined, now);
    assert.equal(range.start, "2026-03-01");
    assert.equal(range.end, "2026-03-31");
  });

  it("previous range has equal length", () => {
    const prev = previousRange({ start: "2026-03-01", end: "2026-03-31" });
    assert.equal(prev.start, "2026-01-29");
    assert.equal(prev.end, "2026-02-28");
  });

  it("summarizes income and spending", () => {
    const range = { start: "2026-03-01", end: "2026-03-31" };
    const filtered = filterTransactions(sample, range, "all", null);
    const summary = summarize(filtered);
    assert.equal(summary.totalIncome, 10000);
    assert.equal(summary.totalSpending, 3500);
    assert.equal(summary.netChange, 6500);
    assert.ok(summary.savingsRate != null);
    assert.ok(Math.abs(summary.savingsRate - 65) < 0.01);
  });

  it("groups spending by category (method)", () => {
    const range = { start: "2026-03-01", end: "2026-03-31" };
    const filtered = filterTransactions(sample, range, "all", null);
    const cats = spendingByCategory(filtered, "Uncategorized");
    assert.equal(cats[0].label, "Bank");
    assert.equal(cats[0].amount, 3000);
  });

  it("lists biggest expenses", () => {
    const range = { start: "2026-01-01", end: "2026-12-31" };
    const filtered = filterTransactions(sample, range, "out", null);
    const top = biggestExpenses(filtered, 2);
    assert.equal(top[0].name, "Rent");
    assert.equal(top[1].name, "Groceries");
  });

  it("builds time buckets", () => {
    const range = { start: "2026-03-01", end: "2026-03-10" };
    const filtered = filterTransactions(sample, range, "all", null);
    const buckets = timeBuckets(filtered, range, "en");
    assert.ok(buckets.length >= 1);
    const totalIn = buckets.reduce((s, b) => s + b.income, 0);
    assert.equal(totalIn, 10000);
  });

  it("toIsoDate is stable", () => {
    assert.equal(toIsoDate(new Date(2026, 0, 5)), "2026-01-05");
  });
});
