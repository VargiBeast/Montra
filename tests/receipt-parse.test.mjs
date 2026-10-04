import assert from "node:assert/strict";
import test from "node:test";
import { parseReceiptText } from "../src/lib/receiptParse.ts";

test("extracts Norwegian receipt total, currency and date", () => {
  const parsed = parseReceiptText(`REMA 1000
Org.nr 123456789
Melk 29,90
SUM 349,90
Å BETALE 349,90 NOK
04.10.2026 18:12`);
  assert.equal(parsed.merchant, "REMA 1000");
  assert.equal(parsed.totalAmount, 349.9);
  assert.equal(parsed.currency, "NOK");
  assert.equal(parsed.receiptDate, "2026-10-04");
});

test("leaves uncertain fields empty", () => {
  const parsed = parseReceiptText("hello\nworld", "NOK");
  assert.equal(parsed.merchant, "hello");
  assert.equal(parsed.totalAmount, null);
  assert.equal(parsed.receiptDate, "");
});

test("does not treat a random number as the total", () => {
  const parsed = parseReceiptText("KIWI\n12,50\n19,00");
  assert.equal(parsed.totalAmount, null);
});
