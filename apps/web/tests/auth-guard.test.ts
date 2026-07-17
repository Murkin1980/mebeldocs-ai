import assert from "node:assert/strict";
import test from "node:test";
import {
  getServerContext,
  requireWriteAccess,
  requireReadAccess,
  AuthError,
  sanitizePayment,
} from "../lib/auth/server-context.ts";
import type { Payment } from "../lib/domain/entities.ts";

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-001",
    companyId: "company-grand-mebel",
    date: "2026-05-15",
    amountTiyn: 1500000,
    method: "bank_transfer",
    status: "draft",
    actorId: "user-001",
    createdAt: "2026-05-15T10:00:00Z",
    updatedAt: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

test("getServerContext returns non-null context", () => {
  const ctx = getServerContext();
  assert.ok(ctx, "Context should not be null");
  assert.ok(ctx.user, "Context should have a user");
});

test("getServerContext user has companyId", () => {
  const ctx = getServerContext();
  assert.equal(typeof ctx.user.companyId, "string");
  assert.ok(ctx.user.companyId.length > 0, "companyId should not be empty");
});

test("getServerContext user has userId", () => {
  const ctx = getServerContext();
  assert.equal(typeof ctx.user.userId, "string");
  assert.ok(ctx.user.userId.length > 0, "userId should not be empty");
});

test("getServerContext user has role owner", () => {
  const ctx = getServerContext();
  assert.equal(ctx.user.role, "owner");
});

test("getServerContext user has name", () => {
  const ctx = getServerContext();
  assert.equal(typeof ctx.user.name, "string");
  assert.ok(ctx.user.name.length > 0, "name should not be empty");
});

test("requireWriteAccess with owner → no throw", () => {
  const ctx = getServerContext();
  requireWriteAccess(ctx);
});

test("requireWriteAccess with accountant → no throw", () => {
  const ctx = { user: { ...getServerContext().user, role: "accountant" as const } };
  requireWriteAccess(ctx);
});

test("requireWriteAccess with observer → throws AuthError forbidden", () => {
  const ctx = { user: { ...getServerContext().user, role: "observer" as const } };
  assert.throws(
    () => requireWriteAccess(ctx),
    (err: unknown) => {
      assert.ok(err instanceof AuthError, `Expected AuthError, got ${err}`);
      assert.equal(err.code, "forbidden");
      return true;
    },
  );
});

test("requireReadAccess with owner → no throw", () => {
  const ctx = getServerContext();
  requireReadAccess(ctx);
});

test("requireReadAccess with observer → no throw (all can read)", () => {
  const ctx = { user: { ...getServerContext().user, role: "observer" as const } };
  requireReadAccess(ctx);
});

test("sanitizePayment strips companyId", () => {
  const payment = makePayment({ companyId: "secret-company" });
  const sanitized = sanitizePayment(payment);
  assert.equal((sanitized as Record<string, unknown>).companyId, undefined);
});

test("sanitizePayment strips actorId", () => {
  const payment = makePayment({ actorId: "secret-user" });
  const sanitized = sanitizePayment(payment);
  assert.equal((sanitized as Record<string, unknown>).actorId, undefined);
});

test("sanitizePayment preserves id", () => {
  const payment = makePayment({ id: "pay-123" });
  const sanitized = sanitizePayment(payment);
  assert.equal(sanitized.id, "pay-123");
});

test("sanitizePayment preserves date", () => {
  const payment = makePayment({ date: "2026-06-01" });
  const sanitized = sanitizePayment(payment);
  assert.equal(sanitized.date, "2026-06-01");
});

test("sanitizePayment preserves amountTiyn", () => {
  const payment = makePayment({ amountTiyn: 999999 });
  const sanitized = sanitizePayment(payment);
  assert.equal(sanitized.amountTiyn, 999999);
});

test("sanitizePayment preserves status", () => {
  const payment = makePayment({ status: "matched" });
  const sanitized = sanitizePayment(payment);
  assert.equal(sanitized.status, "matched");
});

test("sanitizePayment preserves optional fields when present", () => {
  const payment = makePayment({
    counterpartyId: "cp-1",
    invoiceId: "inv-1",
    invoiceReference: "REF-001",
    notes: "test notes",
  });
  const sanitized = sanitizePayment(payment);
  assert.equal(sanitized.counterpartyId, "cp-1");
  assert.equal(sanitized.invoiceId, "inv-1");
  assert.equal(sanitized.invoiceReference, "REF-001");
  assert.equal(sanitized.notes, "test notes");
});

test("AuthError has correct name property", () => {
  const err = new AuthError("forbidden", "test message");
  assert.equal(err.name, "AuthError");
  assert.equal(err.code, "forbidden");
  assert.equal(err.message, "test message");
  assert.ok(err instanceof Error);
});

test("AuthError supports unauthorized code", () => {
  const err = new AuthError("unauthorized", "not logged in");
  assert.equal(err.code, "unauthorized");
});

test("AuthError supports not_found code", () => {
  const err = new AuthError("not_found", "resource missing");
  assert.equal(err.code, "not_found");
});
