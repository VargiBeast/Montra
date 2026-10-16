import test from "node:test";
import assert from "node:assert/strict";
import {
  clampDay,
  computeNextDueDate,
  advanceAfterOccurrence,
} from "../src/types/recurringPayment.ts";

test("clampDay: Jan 31 into February non-leap", () => {
  assert.equal(clampDay(2026, 2, 31), 28);
});

test("clampDay: Jan 31 into February leap", () => {
  assert.equal(clampDay(2024, 2, 31), 29);
});

test("monthly: stable schedule_day recovers after short month", () => {
  const next = computeNextDueDate({
    interval: "monthly",
    anchor_date: "2026-01-31",
    schedule_day: 31,
    fromYmd: "2026-03-01",
  });
  assert.equal(next, "2026-03-31");
});

test("monthly: Feb clamp then March restores 31", () => {
  const feb = computeNextDueDate({
    interval: "monthly",
    anchor_date: "2026-01-31",
    schedule_day: 31,
    fromYmd: "2026-02-01",
  });
  assert.equal(feb, "2026-02-28");
  const afterFeb = advanceAfterOccurrence({
    interval: "monthly",
    anchor_date: "2026-01-31",
    schedule_day: 31,
    occurredOn: feb,
  });
  assert.equal(afterFeb, "2026-03-31");
});

test("weekly advances by 7 days", () => {
  const next = computeNextDueDate({
    interval: "weekly",
    anchor_date: "2026-10-10",
    schedule_day: null,
    fromYmd: "2026-10-16",
  });
  assert.equal(next, "2026-10-17");
});

test("yearly leap day source clamps in non-leap", () => {
  const next = computeNextDueDate({
    interval: "yearly",
    anchor_date: "2024-02-29",
    schedule_day: 29,
    fromYmd: "2025-01-01",
  });
  assert.equal(next, "2025-02-28");
});

test("past-due: next due is on or after fromYmd", () => {
  const next = computeNextDueDate({
    interval: "monthly",
    anchor_date: "2025-01-15",
    schedule_day: 15,
    fromYmd: "2026-10-16",
  });
  assert.ok(next >= "2026-10-16");
  assert.equal(next, "2026-11-15");
});
