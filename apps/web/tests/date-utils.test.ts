import assert from "node:assert/strict";
import test from "node:test";
import {
  validateDateString,
  isValidDateString,
  getDefaultDate,
  isDateNotAfterToday,
  isDateNotAfterTodayWithReason,
} from "../lib/domain/date-utils.ts";

test('"2026-02-29" → invalid (not a leap year)', () => {
  const result = validateDateString("2026-02-29");
  assert.equal(result.valid, false);
  assert.ok(result.reason);
});

test('"2024-02-29" → valid (leap year)', () => {
  const result = validateDateString("2024-02-29");
  assert.equal(result.valid, true);
  assert.equal(result.reason, undefined);
});

test('"2026-04-31" → invalid (April has 30 days)', () => {
  const result = validateDateString("2026-04-31");
  assert.equal(result.valid, false);
  assert.ok(result.reason);
});

test('"2026-12-31" → valid', () => {
  const result = validateDateString("2026-12-31");
  assert.equal(result.valid, true);
});

test('"2026-00-01" → invalid (month 0)', () => {
  const result = validateDateString("2026-00-01");
  assert.equal(result.valid, false);
  assert.ok(result.reason);
});

test('"2026-13-01" → invalid (month 13)', () => {
  const result = validateDateString("2026-13-01");
  assert.equal(result.valid, false);
  assert.ok(result.reason);
});

test('"2026-01-00" → invalid (day 0)', () => {
  const result = validateDateString("2026-01-00");
  assert.equal(result.valid, false);
  assert.ok(result.reason);
});

test('"" → invalid', () => {
  const result = validateDateString("");
  assert.equal(result.valid, false);
});

test('"not-a-date" → invalid', () => {
  const result = validateDateString("not-a-date");
  assert.equal(result.valid, false);
});

test('"2026-01-15" → valid', () => {
  const result = validateDateString("2026-01-15");
  assert.equal(result.valid, true);
});

test("isValidDateString wraps validateDateString", () => {
  assert.equal(isValidDateString("2026-01-15"), true);
  assert.equal(isValidDateString("2026-02-30"), false);
  assert.equal(isValidDateString(""), false);
});

test("getDefaultDate returns YYYY-MM-DD format string", () => {
  const date = getDefaultDate();
  assert.ok(
    /^\d{4}-\d{2}-\d{2}$/.test(date),
    `Expected YYYY-MM-DD format, got: ${date}`,
  );
});

test("getDefaultDate returns a reasonable date in Almaty timezone", () => {
  const date = getDefaultDate();
  const [year, month, day] = date.split("-").map(Number);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  assert.ok(
    year >= currentYear - 1 && year <= currentYear + 1,
    `Year ${year} is out of reasonable range`,
  );
  assert.ok(month >= 1 && month <= 12, `Month ${month} is invalid`);
  assert.ok(day >= 1 && day <= 31, `Day ${day} is invalid`);
});

test("getDefaultDate is at most 1 day ahead of UTC date (Almaty is UTC+6)", () => {
  const almatyDate = getDefaultDate();
  const utcDate = new Date().toISOString().slice(0, 10);
  const almatyTime = new Date(almatyDate + "T00:00:00Z").getTime();
  const utcTime = new Date(utcDate + "T00:00:00Z").getTime();
  const diffDays = Math.abs(almatyTime - utcTime) / (24 * 60 * 60 * 1000);
  assert.ok(
    diffDays <= 1,
    `Almaty date ${almatyDate} differs from UTC ${utcDate} by ${diffDays} days`,
  );
});

test("getDefaultDate is never behind UTC date (Almaty is UTC+6, always ahead)", () => {
  const almatyDate = getDefaultDate();
  const utcDate = new Date().toISOString().slice(0, 10);
  assert.ok(
    almatyDate >= utcDate,
    `Almaty date ${almatyDate} should be >= UTC date ${utcDate}`,
  );
});

test("isDateNotAfterToday with a past date → true", () => {
  assert.equal(isDateNotAfterToday("2020-01-01"), true);
});

test("isDateNotAfterToday with today → true", () => {
  const today = getDefaultDate();
  assert.equal(isDateNotAfterToday(today), true);
});

test("isDateNotAfterToday with a far future date → false", () => {
  assert.equal(isDateNotAfterToday("2099-12-31"), false);
});

test("isDateNotAfterToday with invalid date → false", () => {
  assert.equal(isDateNotAfterToday("not-a-date"), false);
  assert.equal(isDateNotAfterToday(""), false);
});

test("isDateNotAfterTodayWithReason returns reason for future dates", () => {
  const result = isDateNotAfterTodayWithReason("2099-12-31");
  assert.equal(result.valid, false);
  assert.ok(result.reason, "Expected a reason string for future date");
  assert.ok(result.reason!.includes("будущем"));
});

test("isDateNotAfterTodayWithReason returns no reason for valid past date", () => {
  const result = isDateNotAfterTodayWithReason("2020-06-15");
  assert.equal(result.valid, true);
  assert.equal(result.reason, undefined);
});
