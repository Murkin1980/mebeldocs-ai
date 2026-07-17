import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateInvoiceBalance,
  validatePaymentAmount,
} from "../lib/domain/payment-calculations.ts";
import type { PaymentMatchEvent } from "../lib/domain/entities.ts";

function makeMatchEvent(
  overrides: Partial<PaymentMatchEvent> = {},
): PaymentMatchEvent {
  return {
    id: "match-1",
    paymentId: "pay-1",
    invoiceId: "inv-1",
    amountTiyn: 500000,
    matchedBy: "user-1",
    matchedAt: "2026-05-01T10:00:00Z",
    idempotencyKey: "idem-1",
    ...overrides,
  };
}

test("No match events → unpaid, remainingTiyn = invoiceTotalTiyn", () => {
  const balance = calculateInvoiceBalance(1000000, []);
  assert.equal(balance.status, "unpaid");
  assert.equal(balance.remainingTiyn, 1000000);
  assert.equal(balance.confirmedPaidTiyn, 0);
  assert.equal(balance.invoiceTotalTiyn, 1000000);
});

test("One match of 500000 on 1000000 invoice → partially_paid, remaining 500000", () => {
  const events = [makeMatchEvent({ amountTiyn: 500000 })];
  const balance = calculateInvoiceBalance(1000000, events);
  assert.equal(balance.status, "partially_paid");
  assert.equal(balance.remainingTiyn, 500000);
  assert.equal(balance.confirmedPaidTiyn, 500000);
});

test("Full match → paid, remaining 0", () => {
  const events = [makeMatchEvent({ amountTiyn: 1000000 })];
  const balance = calculateInvoiceBalance(1000000, events);
  assert.equal(balance.status, "paid");
  assert.equal(balance.remainingTiyn, 0);
  assert.equal(balance.confirmedPaidTiyn, 1000000);
});

test("Overpaid (match > total) → overpaid, remaining negative", () => {
  const events = [makeMatchEvent({ amountTiyn: 1500000 })];
  const balance = calculateInvoiceBalance(1000000, events);
  assert.equal(balance.status, "overpaid");
  assert.equal(balance.remainingTiyn, -500000);
  assert.equal(balance.confirmedPaidTiyn, 1500000);
});

test("Reversed match event excluded from calculation", () => {
  const events = [
    makeMatchEvent({ id: "m1", amountTiyn: 500000 }),
    makeMatchEvent({
      id: "m2",
      amountTiyn: 300000,
      reversed: true,
    }),
  ];
  const balance = calculateInvoiceBalance(1000000, events);
  assert.equal(balance.confirmedPaidTiyn, 500000);
  assert.equal(balance.remainingTiyn, 500000);
  assert.equal(balance.status, "partially_paid");
});

test("Two partial payments sum correctly (integer math, no float)", () => {
  const events = [
    makeMatchEvent({ id: "m1", amountTiyn: 123456789 }),
    makeMatchEvent({ id: "m2", amountTiyn: 987654321 }),
  ];
  const balance = calculateInvoiceBalance(2000000000, events);
  assert.equal(balance.confirmedPaidTiyn, 123456789 + 987654321);
  assert.equal(balance.remainingTiyn, 2000000000 - (123456789 + 987654321));
  assert.equal(balance.status, "partially_paid");
});

test("All reversed events → unpaid", () => {
  const events = [
    makeMatchEvent({ id: "m1", amountTiyn: 500000, reversed: true }),
    makeMatchEvent({ id: "m2", amountTiyn: 300000, reversed: true }),
  ];
  const balance = calculateInvoiceBalance(1000000, events);
  assert.equal(balance.status, "unpaid");
  assert.equal(balance.confirmedPaidTiyn, 0);
  assert.equal(balance.remainingTiyn, 1000000);
});

test("InvoiceBalance includes correct invoiceId from events", () => {
  const events = [
    makeMatchEvent({ invoiceId: "inv-abc", amountTiyn: 100 }),
  ];
  const balance = calculateInvoiceBalance(1000, events);
  assert.equal(balance.invoiceId, "inv-abc");
});

test("InvoiceBalance with no events has empty invoiceId", () => {
  const balance = calculateInvoiceBalance(1000, []);
  assert.equal(balance.invoiceId, "");
});

test("validatePaymentAmount(500) → no throw", () => {
  validatePaymentAmount(500);
});

test("validatePaymentAmount(1) → no throw (minimum valid)", () => {
  validatePaymentAmount(1);
});

test("validatePaymentAmount(0) → throws", () => {
  assert.throws(
    () => validatePaymentAmount(0),
    /больше нуля/,
  );
});

test("validatePaymentAmount(-1) → throws", () => {
  assert.throws(
    () => validatePaymentAmount(-1),
    /больше нуля/,
  );
});

test("validatePaymentAmount(1.5) → throws (not integer)", () => {
  assert.throws(
    () => validatePaymentAmount(1.5),
    /целым числом/,
  );
});

test("validatePaymentAmount(0.001) → throws (not integer)", () => {
  assert.throws(
    () => validatePaymentAmount(0.001),
    /целым числом/,
  );
});
