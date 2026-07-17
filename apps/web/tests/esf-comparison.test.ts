import assert from "node:assert/strict";
import test from "node:test";
import { compareEsfData, calculateVerificationResult } from "../lib/esf/comparison.ts";
import type { EsfExtractedData, EsfFieldComparison } from "../lib/domain/entities.ts";

function baseData(overrides: Partial<EsfExtractedData> = {}): EsfExtractedData {
  return {
    esfNumber: "ЭСФ-2026-001",
    registrationNumber: "REG-123456",
    status: "Проведен",
    issueDate: "2026-05-15",
    turnoverDate: "2026-05-10",
    sellerName: "Гранд Мебель",
    sellerBinIin: "123456789012",
    buyerName: "Freedom Life",
    buyerBinIin: "987654321098",
    totalAmountTiyn: 150000000,
    ...overrides,
  };
}

test("Identical data → all fields match, result passed", () => {
  const data = baseData();
  const fields = compareEsfData(data, baseData());
  assert.ok(fields.length > 0, "Should have comparison fields");
  assert.ok(
    fields.every((f) => f.status === "match" || f.status === "not_checked"),
    `Not all fields match: ${fields.filter((f) => f.status !== "match" && f.status !== "not_checked").map((f) => `${f.fieldName}:${f.status}`).join(", ")}`,
  );
  assert.equal(calculateVerificationResult(fields), "passed");
});

test("Different turnoverDate → field error, result errors", () => {
  const expected = baseData();
  const actual = baseData({ turnoverDate: "2026-06-01" });
  const fields = compareEsfData(expected, actual);
  const turnoverField = fields.find((f) => f.fieldName === "Дата оборота");
  assert.ok(turnoverField, "Should have turnoverDate field");
  assert.equal(turnoverField.status, "error");
  assert.equal(calculateVerificationResult(fields), "errors");
});

test("Different totalAmountTiyn → field error, result errors", () => {
  const expected = baseData({ totalAmountTiyn: 100000000 });
  const actual = baseData({ totalAmountTiyn: 200000000 });
  const fields = compareEsfData(expected, actual);
  const amountField = fields.find((f) => f.fieldName === "Сумма (тиын)");
  assert.ok(amountField, "Should have totalAmount field");
  assert.equal(amountField.status, "error");
  assert.equal(calculateVerificationResult(fields), "errors");
});

test("Expected registrationNumber empty, actual non-empty → match", () => {
  const expected = baseData({ registrationNumber: "" });
  const actual = baseData({ registrationNumber: "NEW-REG-789" });
  const fields = compareEsfData(expected, actual);
  const regField = fields.find((f) => f.fieldName === "Регистрационный номер");
  assert.ok(regField, "Should have registrationNumber field");
  assert.equal(regField.status, "match");
});

test("Expected registrationNumber non-empty, different actual → error", () => {
  const expected = baseData({ registrationNumber: "REG-OLD" });
  const actual = baseData({ registrationNumber: "REG-NEW" });
  const fields = compareEsfData(expected, actual);
  const regField = fields.find((f) => f.fieldName === "Регистрационный номер");
  assert.ok(regField, "Should have registrationNumber field");
  assert.equal(regField.status, "error");
});

test("Different sellerBinIin → error", () => {
  const expected = baseData();
  const actual = baseData({ sellerBinIin: "111111111111" });
  const fields = compareEsfData(expected, actual);
  const sellerField = fields.find((f) => f.fieldName === "Продавец (БИН/ИИН)");
  assert.ok(sellerField, "Should have sellerBinIin field");
  assert.equal(sellerField.status, "error");
});

test("Different buyerName → error", () => {
  const expected = baseData();
  const actual = baseData({ buyerName: "Другой Покупатель" });
  const fields = compareEsfData(expected, actual);
  const buyerField = fields.find((f) => f.fieldName === "Покупатель (наименование)");
  assert.ok(buyerField, "Should have buyerName field");
  assert.equal(buyerField.status, "error");
});

test("Different status → error", () => {
  const expected = baseData();
  const actual = baseData({ status: "Аннулирован" });
  const fields = compareEsfData(expected, actual);
  const statusField = fields.find((f) => f.fieldName === "Статус");
  assert.ok(statusField, "Should have status field");
  assert.equal(statusField.status, "error");
});

test("Different issueDate → error", () => {
  const expected = baseData();
  const actual = baseData({ issueDate: "2026-06-20" });
  const fields = compareEsfData(expected, actual);
  const dateField = fields.find((f) => f.fieldName === "Дата выдачи");
  assert.ok(dateField, "Should have issueDate field");
  assert.equal(dateField.status, "error");
});

test("Different esfNumber → error", () => {
  const expected = baseData();
  const actual = baseData({ esfNumber: "ЭСФ-2026-999" });
  const fields = compareEsfData(expected, actual);
  const numField = fields.find((f) => f.fieldName === "Номер ЭСФ");
  assert.ok(numField, "Should have esfNumber field");
  assert.equal(numField.status, "error");
});

test("All warnings → result warnings", () => {
  const fields: EsfFieldComparison[] = [
    {
      fieldName: "Поле A",
      expectedValue: "a",
      actualValue: "b",
      status: "warning",
      explanation: "diff",
      expectedSource: "test",
    },
    {
      fieldName: "Поле B",
      expectedValue: "x",
      actualValue: "y",
      status: "warning",
      explanation: "diff",
      expectedSource: "test",
    },
  ];
  assert.equal(calculateVerificationResult(fields), "warnings");
});

test("Mix of match and warning → result warnings", () => {
  const fields: EsfFieldComparison[] = [
    {
      fieldName: "Поле A",
      expectedValue: "a",
      actualValue: "a",
      status: "match",
      explanation: "ok",
      expectedSource: "test",
    },
    {
      fieldName: "Поле B",
      expectedValue: "x",
      actualValue: "y",
      status: "warning",
      explanation: "diff",
      expectedSource: "test",
    },
  ];
  assert.equal(calculateVerificationResult(fields), "warnings");
});

test("Empty expected and empty actual for registrationNumber → not_checked", () => {
  const expected = baseData({ registrationNumber: "" });
  const actual = baseData({ registrationNumber: "" });
  const fields = compareEsfData(expected, actual);
  const regField = fields.find((f) => f.fieldName === "Регистрационный номер");
  assert.ok(regField, "Should have registrationNumber field");
  assert.equal(regField.status, "not_checked");
});

test("calculateVerificationResult with empty array → passed", () => {
  assert.equal(calculateVerificationResult([]), "passed");
});

test("calculateVerificationResult with one error → errors", () => {
  const fields: EsfFieldComparison[] = [
    {
      fieldName: "Поле A",
      expectedValue: "a",
      actualValue: "b",
      status: "error",
      explanation: "mismatch",
      expectedSource: "test",
    },
  ];
  assert.equal(calculateVerificationResult(fields), "errors");
});

test("calculateVerificationResult with warnings only → warnings", () => {
  const fields: EsfFieldComparison[] = [
    {
      fieldName: "Поле A",
      expectedValue: "a",
      actualValue: "b",
      status: "warning",
      explanation: "minor diff",
      expectedSource: "test",
    },
  ];
  assert.equal(calculateVerificationResult(fields), "warnings");
});

test("calculateVerificationResult with not_checked → warnings", () => {
  const fields: EsfFieldComparison[] = [
    {
      fieldName: "Рег. номер",
      expectedValue: "",
      actualValue: "",
      status: "not_checked",
      explanation: "absent",
      expectedSource: "test",
    },
  ];
  assert.equal(calculateVerificationResult(fields), "warnings");
});

test("totalAmountTiyn within 1% tolerance → warning", () => {
  const expected = baseData({ totalAmountTiyn: 100000 });
  const actual = baseData({ totalAmountTiyn: 100500 });
  const fields = compareEsfData(expected, actual);
  const amountField = fields.find((f) => f.fieldName === "Сумма (тиын)");
  assert.ok(amountField, "Should have totalAmount field");
  assert.equal(amountField.status, "warning");
});

test("totalAmountTiyn equal → match", () => {
  const expected = baseData({ totalAmountTiyn: 500000 });
  const actual = baseData({ totalAmountTiyn: 500000 });
  const fields = compareEsfData(expected, actual);
  const amountField = fields.find((f) => f.fieldName === "Сумма (тиын)");
  assert.ok(amountField, "Should have totalAmount field");
  assert.equal(amountField.status, "match");
});

test("String field empty expected, non-empty actual → warning", () => {
  const expected = baseData({ sellerName: "" });
  const actual = baseData({ sellerName: "Новый Продавец" });
  const fields = compareEsfData(expected, actual);
  const sellerField = fields.find((f) => f.fieldName === "Продавец (наименование)");
  assert.ok(sellerField, "Should have sellerName field");
  assert.equal(sellerField.status, "warning");
});

test("String field non-empty expected, empty actual → warning", () => {
  const expected = baseData({ buyerName: "Ожидаемый" });
  const actual = baseData({ buyerName: "" });
  const fields = compareEsfData(expected, actual);
  const buyerField = fields.find((f) => f.fieldName === "Покупатель (наименование)");
  assert.ok(buyerField, "Should have buyerName field");
  assert.equal(buyerField.status, "warning");
});
