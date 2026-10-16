import test from "node:test";
import assert from "node:assert/strict";
import { projectWhatIf } from "../src/lib/whatIf.ts";

const goal = {
  current_amount: 2000,
  target_amount: 5000,
  deadline: "2027-04-01",
};

test("whatIf: zero rate yields null months", () => {
  const r = projectWhatIf(goal, { monthlySave: 0 }, new Date("2026-10-16"));
  assert.equal(r.monthsToGoal, null);
  assert.equal(r.remaining, 3000);
});

test("whatIf: 500/month needs 6 months", () => {
  const r = projectWhatIf(goal, { monthlySave: 500 }, new Date("2026-10-16"));
  assert.equal(r.monthsToGoal, 6);
  assert.equal(r.estimatedMonth, "2027-04");
});

test("whatIf: completed goal", () => {
  const r = projectWhatIf(
    { current_amount: 5000, target_amount: 5000, deadline: null },
    { monthlySave: 100 },
  );
  assert.equal(r.isComplete, true);
  assert.equal(r.monthsToGoal, 0);
});

test("whatIf: negative input treated as zero", () => {
  const r = projectWhatIf(goal, { monthlySave: -50 });
  assert.equal(r.monthsToGoal, null);
});
