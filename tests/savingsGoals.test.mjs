import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { goalProgress } from "../src/types/savingsGoal.ts";

describe("goalProgress", () => {
  it("handles zero progress", () => {
    const p = goalProgress({ current_amount: 0, target_amount: 10000 });
    assert.equal(p.percent, 0);
    assert.equal(p.remaining, 10000);
    assert.equal(p.isComplete, false);
  });
  it("handles partial progress", () => {
    const p = goalProgress({ current_amount: 6500, target_amount: 15000 });
    assert.equal(p.percent, 43);
    assert.equal(p.remaining, 8500);
    assert.equal(p.isComplete, false);
  });
  it("handles 100% completion", () => {
    const p = goalProgress({ current_amount: 15000, target_amount: 15000 });
    assert.equal(p.percent, 100);
    assert.equal(p.remaining, 0);
    assert.equal(p.isComplete, true);
  });
  it("handles over-target", () => {
    const p = goalProgress({ current_amount: 20000, target_amount: 15000 });
    assert.equal(p.percent, 100);
    assert.equal(p.isOverTarget, true);
    assert.equal(p.isComplete, true);
    assert.equal(p.remaining, 0);
  });
});
