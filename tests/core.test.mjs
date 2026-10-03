import assert from "node:assert/strict";
import test from "node:test";
import {
  getBalanceSummary,
  isImportableTransaction,
  isValidCalendarDate,
  validateProductUrl,
} from "../src/lib/utils.ts";

test("balance totals include real income and spending amounts", () => {
  const totals = getBalanceSummary([
    { type: "in", amount: 1500 },
    { type: "out", amount: 275.5 },
    { type: "in", amount: "25" },
  ]);
  assert.deepEqual(totals, { totalIn: 1525, totalOut: 275.5, balance: 1249.5 });
});

test("product URLs are normalized only for HTTP and HTTPS", () => {
  assert.deepEqual(validateProductUrl(" https://shop.example/items/7 "), {
    url: "https://shop.example/items/7",
    error: null,
  });
  assert.deepEqual(validateProductUrl(""), { url: null, error: null });
  for (const value of ["javascript:alert(1)", "ftp://shop.example/file", "not a URL"]) {
    assert.equal(validateProductUrl(value).url, null);
    assert.ok(validateProductUrl(value).error);
  }
});

test("product URLs cannot contain embedded sign-in credentials", () => {
  const result = validateProductUrl("https://person:password@shop.example/item");
  assert.equal(result.url, null);
  assert.match(result.error, /sign-in details/i);
});

test("calendar dates and imported transaction records are validated", () => {
  assert.equal(isValidCalendarDate("2024-02-29"), true);
  assert.equal(isValidCalendarDate("2025-02-29"), false);
  assert.equal(isValidCalendarDate("2025-13-01"), false);
  assert.equal(isImportableTransaction({
    type: "out",
    name: "Coffee",
    amount: 4.5,
    date: "2026-10-03",
  }), true);
  assert.equal(isImportableTransaction({
    type: "in",
    name: "Invalid date",
    amount: 12,
    date: "2026-02-30",
  }), false);
});