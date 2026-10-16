import test from "node:test";
import assert from "node:assert/strict";
import { buildMonthHistory, buildMoneyJourney } from "../src/lib/moneyJourney.ts";

test("month history skips empty months and sorts", () => {
  const txs = [
    { id: "1", type: "in", amount: 100, date: "2026-08-05", method: "a", name: "a" },
    { id: "2", type: "out", amount: 40, date: "2026-08-10", method: "a", name: "b" },
    { id: "3", type: "in", amount: 50, date: "2026-10-01", method: "a", name: "c" },
  ];
  const rows = buildMonthHistory(txs, 6);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].month, "2026-08");
  assert.equal(rows[0].income, 100);
  assert.equal(rows[0].spending, 40);
  assert.equal(rows[0].net, 60);
  assert.equal(rows[1].month, "2026-10");
});

test("journey empty without data", () => {
  const j = buildMoneyJourney([], [], 6);
  assert.equal(j.hasHistory, false);
  assert.equal(j.hasGoals, false);
});

test("journey milestones from goals only", () => {
  const j = buildMoneyJourney(
    [],
    [{ id: "g1", user_id: "u", name: "Trip", target_amount: 1000, current_amount: 500, deadline: null, created_at: "", updated_at: "" }],
  );
  assert.equal(j.hasGoals, true);
  assert.equal(j.milestones[0].percent, 50);
});
