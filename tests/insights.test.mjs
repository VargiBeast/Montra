import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMonthForecast,
  buildSavingsProjection,
  buildSpendingInsights,
  buildUnusualInsights,
  groupByMonth,
} from "../src/lib/insights.ts";

function tx(partial) {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    type: partial.type ?? "out",
    name: partial.name ?? "Item",
    amount: partial.amount,
    date: partial.date,
    method: partial.method ?? null,
    link: null,
    note: null,
    image: null,
    created_at: partial.date + "T12:00:00Z",
    updated_at: partial.date + "T12:00:00Z",
  };
}

describe("insights", () => {
  it("returns no spending insights with empty data", () => {
    const range = { start: "2026-03-01", end: "2026-03-31" };
    assert.equal(buildSpendingInsights([], range, "Uncategorized").length, 0);
  });

  it("detects spending increase vs previous period when enough data", () => {
    const txs = [
      tx({ type: "out", amount: 100, date: "2026-02-05", method: "Card" }),
      tx({ type: "out", amount: 100, date: "2026-02-10", method: "Card" }),
      tx({ type: "out", amount: 100, date: "2026-02-15", method: "Card" }),
      tx({ type: "out", amount: 200, date: "2026-03-05", method: "Card" }),
      tx({ type: "out", amount: 200, date: "2026-03-10", method: "Card" }),
      tx({ type: "out", amount: 200, date: "2026-03-15", method: "Card" }),
    ];
    const insights = buildSpendingInsights(
      txs,
      { start: "2026-03-01", end: "2026-03-31" },
      "Uncategorized",
    );
    const change = insights.find((i) => i.kind === "spending_change");
    assert.ok(change, "expected spending_change insight");
    assert.equal(change.messageKey, "insightSpendingUp");
    assert.ok(Number(change.values.percent) >= 5);
  });

  it("detects category share when one category dominates", () => {
    const txs = [
      tx({ type: "out", amount: 80, date: "2026-03-01", method: "Food" }),
      tx({ type: "out", amount: 80, date: "2026-03-08", method: "Food" }),
      tx({ type: "out", amount: 20, date: "2026-03-15", method: "Other" }),
    ];
    const insights = buildSpendingInsights(
      txs,
      { start: "2026-03-01", end: "2026-03-31" },
      "Uncategorized",
    );
    const share = insights.find((i) => i.kind === "category_share");
    assert.ok(share);
    assert.equal(share.values.category, "Food");
    assert.ok(Number(share.values.percent) >= 20);
  });

  it("skips unusual detection without enough history", () => {
    const txs = [
      tx({ type: "out", amount: 50, date: "2026-03-01" }),
      tx({ type: "out", amount: 5000, date: "2026-03-10" }),
    ];
    const insights = buildUnusualInsights(txs, { start: "2026-03-01", end: "2026-03-31" });
    assert.equal(insights.length, 0);
  });

  it("flags unusual large expense against history", () => {
    const txs = [];
    for (let i = 1; i <= 10; i++) {
      txs.push(tx({ type: "out", amount: 100, date: `2026-01-${String(i).padStart(2, "0")}`, name: "Normal" }));
    }
    txs.push(tx({ type: "out", amount: 800, date: "2026-03-15", name: "Big" }));
    const insights = buildUnusualInsights(txs, { start: "2026-03-01", end: "2026-03-31" });
    assert.ok(insights.some((i) => i.kind === "unusual_expense"));
  });

  it("groups transactions by month", () => {
    const map = groupByMonth([
      tx({ amount: 10, date: "2026-01-05" }),
      tx({ amount: 20, date: "2026-01-20" }),
      tx({ amount: 30, date: "2026-02-01" }),
    ]);
    assert.equal(map.get("2026-01").length, 2);
    assert.equal(map.get("2026-02").length, 1);
  });

  it("forecast needs history or enough days this month", () => {
    const empty = buildMonthForecast([], new Date("2026-03-15T12:00:00"));
    assert.equal(empty.hasEnoughData, false);

    const txs = [];
    for (let m = 1; m <= 3; m++) {
      txs.push(tx({ type: "out", amount: 1000, date: `2026-0${m}-10` }));
      txs.push(tx({ type: "in", amount: 3000, date: `2026-0${m}-01` }));
    }
    txs.push(tx({ type: "out", amount: 200, date: "2026-04-05" }));
    const f = buildMonthForecast(txs, new Date("2026-04-15T12:00:00"));
    assert.equal(f.hasEnoughData, true);
    assert.ok(f.expectedSpending != null && f.expectedSpending > 0);
  });

  it("savings projection uses monthly averages", () => {
    const txs = [];
    for (let m = 1; m <= 4; m++) {
      txs.push(tx({ type: "in", amount: 10000, date: `2026-0${m}-01` }));
      txs.push(tx({ type: "out", amount: 7000, date: `2026-0${m}-15` }));
    }
    const p = buildSavingsProjection(txs);
    assert.equal(p.hasEnoughData, true);
    assert.ok(p.avgMonthlyIncome > 0);
    assert.ok(p.avgMonthlySpending > 0);
    assert.ok(p.avgMonthlyNet > 0);
    assert.equal(p.projectedNet3Months, Math.round(p.avgMonthlyNet * 3 * 100) / 100);
  });

  it("projection insufficient with one month", () => {
    const txs = [
      tx({ type: "in", amount: 5000, date: "2026-03-01" }),
      tx({ type: "out", amount: 2000, date: "2026-03-10" }),
    ];
    assert.equal(buildSavingsProjection(txs).hasEnoughData, false);
  });
});
