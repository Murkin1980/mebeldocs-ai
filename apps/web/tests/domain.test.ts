import assert from "node:assert/strict";
import test from "node:test";

import {
  createMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  applyDiscount,
  sumMoney,
  formatMoney,
} from "../lib/domain/money.ts";

import {
  canTransitionOrder,
  canTransitionInvoice,
  validateOrderTransition,
  validateInvoiceTransition,
  getAllowedOrderTransitions,
  getAllowedInvoiceTransitions,
} from "../lib/domain/state-machine.ts";

import type { OrderStatus } from "../lib/domain/entities.ts";

import {
  calculateLineTotal,
  calculateOrderTotals,
  recalculateLine,
  recalculateAllLines,
} from "../lib/domain/calculations.ts";

import {
  isValidBinIin,
  formatBinIin,
  isBlank,
  validateRequired,
  validatePositiveInteger,
  validateNonNegative,
} from "../lib/domain/validation.ts";

import type { OrderLine } from "../lib/domain/entities.ts";

// ──────────────────────────────────────────────
// Money
// ──────────────────────────────────────────────

test("createMoney(100) возвращает KZT с amountTiyn = 100", () => {
  const m = createMoney(100);
  assert.deepStrictEqual(m, { currency: "KZT", amountTiyn: 100 });
});

test("createMoney(0) допустим — нулевая сумма", () => {
  const m = createMoney(0);
  assert.deepStrictEqual(m, { currency: "KZT", amountTiyn: 0 });
});

test("createMoney(-1) выбрасывает ошибку — отрицательное значение", () => {
  assert.throws(() => createMoney(-1), /non-negative integer/);
});

test("createMoney(1.5) выбрасывает ошибку — дробное значение", () => {
  assert.throws(() => createMoney(1.5), /non-negative integer/);
});

test("createMoney(NaN) выбрасывает ошибку", () => {
  assert.throws(() => createMoney(NaN), /non-negative integer/);
});

test("addMoney: 100 + 200 = 300 (одна валюта KZT)", () => {
  const result = addMoney(
    { currency: "KZT", amountTiyn: 100 },
    { currency: "KZT", amountTiyn: 200 },
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 300 });
});

test("addMoney: разные валюты выбрасывают ошибку", () => {
  assert.throws(
    () =>
      addMoney(
        { currency: "KZT", amountTiyn: 100 },
        { currency: "USD" as "KZT", amountTiyn: 200 },
      ),
    /different currencies/,
  );
});

test("subtractMoney: 300 - 100 = 200", () => {
  const result = subtractMoney(
    { currency: "KZT", amountTiyn: 300 },
    { currency: "KZT", amountTiyn: 100 },
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 200 });
});

test("subtractMoney: результат отрицательный — выбрасывает ошибку", () => {
  assert.throws(
    () =>
      subtractMoney(
        { currency: "KZT", amountTiyn: 100 },
        { currency: "KZT", amountTiyn: 300 },
      ),
    /negative/,
  );
});

test("subtractMoney: вычитание нуля допустимо", () => {
  const result = subtractMoney(
    { currency: "KZT", amountTiyn: 500 },
    { currency: "KZT", amountTiyn: 0 },
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 500 });
});

test("multiplyMoney: 1000 tiyn × 1.5 = 1500", () => {
  const result = multiplyMoney(
    { currency: "KZT", amountTiyn: 1000 },
    1500,
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 1500 });
});

test("multiplyMoney: 50000 tiyn × 2 = 100000", () => {
  const result = multiplyMoney(
    { currency: "KZT", amountTiyn: 50000 },
    2000,
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 100000 });
});

test("multiplyMoney: 100 tiyn × 0.5 = 50 (округление)", () => {
  const result = multiplyMoney(
    { currency: "KZT", amountTiyn: 100 },
    500,
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 50 });
});

test("multiplyMoney: количество 0 — ошибка", () => {
  assert.throws(
    () => multiplyMoney({ currency: "KZT", amountTiyn: 100 }, 0),
    /Invalid quantityMilli/,
  );
});

test("multiplyMoney: отрицательное количество — ошибка", () => {
  assert.throws(
    () => multiplyMoney({ currency: "KZT", amountTiyn: 100 }, -500),
    /Invalid quantityMilli/,
  );
});

test("applyDiscount: 1000 - 300 = 700", () => {
  const result = applyDiscount(
    { currency: "KZT", amountTiyn: 1000 },
    300,
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 700 });
});

test("applyDiscount: скидка 0 — сумма не меняется", () => {
  const result = applyDiscount(
    { currency: "KZT", amountTiyn: 500 },
    0,
  );
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 500 });
});

test("applyDiscount: скидка превышает сумму — ошибка", () => {
  assert.throws(
    () => applyDiscount({ currency: "KZT", amountTiyn: 100 }, 200),
    /Discount exceeds amount/,
  );
});

test("applyDiscount: дробная скидка — ошибка", () => {
  assert.throws(
    () => applyDiscount({ currency: "KZT", amountTiyn: 100 }, 50.5),
    /Invalid discount/,
  );
});

test("sumMoney: сумма нескольких позиций", () => {
  const result = sumMoney([
    { currency: "KZT", amountTiyn: 100 },
    { currency: "KZT", amountTiyn: 200 },
    { currency: "KZT", amountTiyn: 50 },
  ]);
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 350 });
});

test("sumMoney: пустой массив = 0", () => {
  const result = sumMoney([]);
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 0 });
});

test("sumMoney: одна позиция", () => {
  const result = sumMoney([{ currency: "KZT", amountTiyn: 42 }]);
  assert.deepStrictEqual(result, { currency: "KZT", amountTiyn: 42 });
});

test("formatMoney(150000 tiyn) содержит символ ₸", () => {
  const str = formatMoney({ currency: "KZT", amountTiyn: 150000 });
  assert.ok(str.includes("₸"), `Ожидался символ ₸ в "${str}"`);
});

test("formatMoney(0) отображает 0", () => {
  const str = formatMoney({ currency: "KZT", amountTiyn: 0 });
  assert.ok(str.includes("₸"));
});

// ──────────────────────────────────────────────
// State machine
// ──────────────────────────────────────────────

test("Order: draft → confirmed допустим", () => {
  assert.ok(canTransitionOrder("draft", "confirmed"));
});

test("Order: draft → cancelled допустим", () => {
  assert.ok(canTransitionOrder("draft", "cancelled"));
});

test("Order: draft → posted НЕ допустим", () => {
  assert.equal(canTransitionOrder("draft", "posted" as OrderStatus), false);
});

test("Order: confirmed → cancelled допустим", () => {
  assert.ok(canTransitionOrder("confirmed", "cancelled"));
});

test("Order: confirmed → draft НЕ допустим", () => {
  assert.equal(canTransitionOrder("confirmed", "draft"), false);
});

test("Order: cancelled → ничего НЕ допустим", () => {
  assert.equal(canTransitionOrder("cancelled", "draft"), false);
  assert.equal(canTransitionOrder("cancelled", "confirmed"), false);
});

test("Invoice: draft → confirmed допустим", () => {
  assert.ok(canTransitionInvoice("draft", "confirmed"));
});

test("Invoice: draft → cancelled допустим", () => {
  assert.ok(canTransitionInvoice("draft", "cancelled"));
});

test("Invoice: draft → posted НЕ допустим", () => {
  assert.equal(canTransitionInvoice("draft", "posted"), false);
});

test("Invoice: confirmed → posted допустим", () => {
  assert.ok(canTransitionInvoice("confirmed", "posted"));
});

test("Invoice: confirmed → cancelled допустим", () => {
  assert.ok(canTransitionInvoice("confirmed", "cancelled"));
});

test("Invoice: posted → ничего НЕ допустим", () => {
  assert.equal(canTransitionInvoice("posted", "draft"), false);
  assert.equal(canTransitionInvoice("posted", "confirmed"), false);
  assert.equal(canTransitionInvoice("posted", "cancelled"), false);
});

test("validateOrderTransition: невалидный переход бросает ошибку", () => {
  assert.throws(
    () => validateOrderTransition("draft", "posted" as OrderStatus),
    /Invalid order transition/,
  );
});

test("validateInvoiceTransition: невалидный переход бросает ошибку", () => {
  assert.throws(
    () => validateInvoiceTransition("draft", "posted"),
    /Invalid invoice transition/,
  );
});

test("validateOrderTransition: валидный переход не бросает", () => {
  validateOrderTransition("draft", "confirmed");
});

test("validateInvoiceTransition: валидный переход не бросает", () => {
  validateInvoiceTransition("confirmed", "posted");
});

test('getAllowedOrderTransitions("draft") → ["confirmed", "cancelled"]', () => {
  assert.deepStrictEqual(getAllowedOrderTransitions("draft"), [
    "confirmed",
    "cancelled",
  ]);
});

test('getAllowedOrderTransitions("confirmed") → ["cancelled"]', () => {
  assert.deepStrictEqual(getAllowedOrderTransitions("confirmed"), [
    "cancelled",
  ]);
});

test('getAllowedOrderTransitions("cancelled") → []', () => {
  assert.deepStrictEqual(getAllowedOrderTransitions("cancelled"), []);
});

test('getAllowedInvoiceTransitions("draft") → ["confirmed", "cancelled"]', () => {
  assert.deepStrictEqual(getAllowedInvoiceTransitions("draft"), [
    "confirmed",
    "cancelled",
  ]);
});

test('getAllowedInvoiceTransitions("confirmed") → ["posted", "cancelled"]', () => {
  assert.deepStrictEqual(getAllowedInvoiceTransitions("confirmed"), [
    "posted",
    "cancelled",
  ]);
});

test('getAllowedInvoiceTransitions("posted") → []', () => {
  assert.deepStrictEqual(getAllowedInvoiceTransitions("posted"), []);
});

// ──────────────────────────────────────────────
// Calculations
// ──────────────────────────────────────────────

test("calculateLineTotal: 2 шт × 50000 без скидки = 100000", () => {
  assert.equal(
    calculateLineTotal({
      quantityMilli: 2000,
      unitPriceTiyn: 50000,
      discountTiyn: 0,
    }),
    100000,
  );
});

test("calculateLineTotal: 1 шт × 100000 со скидкой 5000 = 95000", () => {
  assert.equal(
    calculateLineTotal({
      quantityMilli: 1000,
      unitPriceTiyn: 100000,
      discountTiyn: 5000,
    }),
    95000,
  );
});

test("calculateLineTotal: дробное количество 1.5 шт × 10000 = 15000", () => {
  assert.equal(
    calculateLineTotal({
      quantityMilli: 1500,
      unitPriceTiyn: 10000,
      discountTiyn: 0,
    }),
    15000,
  );
});

test("calculateLineTotal: дробное количество 1.5 шт × 33333 со скидкой", () => {
  // 1.5 × 33333 = 49999.5 → round → 50000, минус скидка 10000 = 40000
  assert.equal(
    calculateLineTotal({
      quantityMilli: 1500,
      unitPriceTiyn: 33333,
      discountTiyn: 10000,
    }),
    40000,
  );
});

test("calculateOrderTotals: несколько позиций без скидок", () => {
  const lines: OrderLine[] = [
    makeLine({ quantityMilli: 2000, unitPriceTiyn: 50000, discountTiyn: 0 }),
    makeLine({ quantityMilli: 1000, unitPriceTiyn: 30000, discountTiyn: 0 }),
  ];
  // 2 × 50000 = 100000, 1 × 30000 = 30000
  const totals = calculateOrderTotals(lines);
  assert.equal(totals.subtotalTiyn, 130000);
  assert.equal(totals.discountTiyn, 0);
  assert.equal(totals.totalTiyn, 130000);
});

test("calculateOrderTotals: позиции со скидками", () => {
  const lines: OrderLine[] = [
    makeLine({ quantityMilli: 1000, unitPriceTiyn: 100000, discountTiyn: 5000 }),
    makeLine({ quantityMilli: 2000, unitPriceTiyn: 20000, discountTiyn: 3000 }),
  ];
  // subtotal: 1×100000 + 2×20000 = 140000
  // discount: 5000 + 3000 = 8000
  // total: 132000
  const totals = calculateOrderTotals(lines);
  assert.equal(totals.subtotalTiyn, 140000);
  assert.equal(totals.discountTiyn, 8000);
  assert.equal(totals.totalTiyn, 132000);
});

test("calculateOrderTotals: общая скидка превышает сумму — ошибка", () => {
  const lines: OrderLine[] = [
    makeLine({ quantityMilli: 1000, unitPriceTiyn: 10000, discountTiyn: 20000 }),
  ];
  assert.throws(() => calculateOrderTotals(lines), /negative/);
});

test("calculateOrderTotals: пустой список позиций", () => {
  const totals = calculateOrderTotals([]);
  assert.equal(totals.subtotalTiyn, 0);
  assert.equal(totals.discountTiyn, 0);
  assert.equal(totals.totalTiyn, 0);
});

test("recalculateLine: обновляет lineTotalTiyn", () => {
  const line = makeLine({
    quantityMilli: 3000,
    unitPriceTiyn: 20000,
    discountTiyn: 1000,
  });
  // 3 × 20000 = 60000, минус 1000 = 59000
  const updated = recalculateLine(line);
  assert.equal(updated.lineTotalTiyn, 59000);
  assert.equal(updated.id, line.id);
  assert.equal(updated.name, line.name);
});

test("recalculateAllLines: обновляет все строки", () => {
  const lines: OrderLine[] = [
    makeLine({ quantityMilli: 1000, unitPriceTiyn: 50000, discountTiyn: 0 }),
    makeLine({ quantityMilli: 2000, unitPriceTiyn: 10000, discountTiyn: 500 }),
  ];
  const updated = recalculateAllLines(lines);
  assert.equal(updated[0].lineTotalTiyn, 50000);
  // 2 × 10000 = 20000, минус 500 = 19500
  assert.equal(updated[1].lineTotalTiyn, 19500);
  assert.equal(updated.length, 2);
});

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

test("isValidBinIin: 12 цифр — true", () => {
  assert.ok(isValidBinIin("123456789012"));
});

test("isValidBinIin: 10 цифр — true", () => {
  assert.ok(isValidBinIin("1234567890"));
});

test("isValidBinIin: 9 цифр — false", () => {
  assert.equal(isValidBinIin("123456789"), false);
});

test("isValidBinIin: 13 цифр — false", () => {
  assert.equal(isValidBinIin("1234567890123"), false);
});

test("isValidBinIin: с дефисами — true", () => {
  assert.ok(isValidBinIin("1234-567-890"));
});

test("isValidBinIin: с пробелами — true", () => {
  assert.ok(isValidBinIin("123 456 789 012"));
});

test("isValidBinIin: с дефисами и скобками — true", () => {
  assert.ok(isValidBinIin("(123)-456-789-012"));
});

test("isValidBinIin: буквы — false", () => {
  assert.equal(isValidBinIin("123456789abc"), false);
});

test("formatBinIin: 12 цифр → \"123 456 789 012\"", () => {
  assert.equal(formatBinIin("123456789012"), "123 456 789 012");
});

test("formatBinIin: 10 цифр → \"1234 567 890\"", () => {
  assert.equal(formatBinIin("1234567890"), "1234 567 890");
});

test("formatBinIin: с дефисами нормализует", () => {
  assert.equal(formatBinIin("123-456-789-012"), "123 456 789 012");
});

test("formatBinIin: невалидная длина — возвращает как есть", () => {
  assert.equal(formatBinIin("abc"), "abc");
});

test('isBlank("") → true', () => {
  assert.equal(isBlank(""), true);
});

test('isBlank("  ") → true', () => {
  assert.equal(isBlank("  "), true);
});

test("isBlank(undefined) → true", () => {
  assert.equal(isBlank(undefined), true);
});

test("isBlank(null) → true", () => {
  assert.equal(isBlank(null), true);
});

test('isBlank("hello") → false', () => {
  assert.equal(isBlank("hello"), false);
});

test('isBlank("  hello  ") → false', () => {
  assert.equal(isBlank("  hello  "), false);
});

test("validateRequired(null, \"name\") выбрасывает ошибку", () => {
  assert.throws(() => validateRequired(null, "name"), /name is required/);
});

test('validateRequired(undefined, "email") выбрасывает ошибку', () => {
  assert.throws(
    () => validateRequired(undefined, "email"),
    /email is required/,
  );
});

test('validateRequired("", "title") выбрасывает ошибку', () => {
  assert.throws(() => validateRequired("", "title"), /title is required/);
});

test('validateRequired("ok", "name") не выбрасывает', () => {
  validateRequired("ok", "name");
});

test("validateRequired(0, \"count\") не выбрасывает — 0 не пустой", () => {
  validateRequired(0, "count");
});

test("validateRequired(false, \"flag\") не выбрасывает", () => {
  validateRequired(false, "flag");
});

test('validatePositiveInteger(5, "qty") не выбрасывает', () => {
  validatePositiveInteger(5, "qty");
});

test('validatePositiveInteger(1, "qty") не выбрасывает', () => {
  validatePositiveInteger(1, "qty");
});

test('validatePositiveInteger(0, "qty") выбрасывает', () => {
  assert.throws(
    () => validatePositiveInteger(0, "qty"),
    /qty must be a positive integer/,
  );
});

test('validatePositiveInteger(-1, "qty") выбрасывает', () => {
  assert.throws(() => validatePositiveInteger(-1, "qty"), /positive integer/);
});

test("validatePositiveInteger(1.5, \"qty\") выбрасывает — дробное", () => {
  assert.throws(() => validatePositiveInteger(1.5, "qty"), /positive integer/);
});

test('validateNonNegative(0, "qty") не выбрасывает', () => {
  validateNonNegative(0, "qty");
});

test('validateNonNegative(10, "qty") не выбрасывает', () => {
  validateNonNegative(10, "qty");
});

test('validateNonNegative(-1, "qty") выбрасывает', () => {
  assert.throws(
    () => validateNonNegative(-1, "qty"),
    /qty must be a non-negative integer/,
  );
});

test("validateNonNegative(-0.5, \"price\") выбрасывает — дробное", () => {
  assert.throws(
    () => validateNonNegative(-0.5, "price"),
    /non-negative integer/,
  );
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

let _lineCounter = 0;

function makeLine(
  overrides: Partial<Omit<OrderLine, "id" | "sortOrder">> = {},
): OrderLine {
  _lineCounter++;
  return {
    id: `line-${_lineCounter}`,
    name: `Позиция ${_lineCounter}`,
    quantityMilli: 1000,
    unit: "шт",
    unitPriceTiyn: 10000,
    discountTiyn: 0,
    lineTotalTiyn: 10000,
    classification: "goods",
    sortOrder: _lineCounter,
    ...overrides,
  };
}
