import type { OrderLine } from "./entities";
import { createMoney, multiplyMoney, applyDiscount, sumMoney, type Money } from "./money";

export function calculateLineTotal(line: {
  quantityMilli: number;
  unitPriceTiyn: number;
  discountTiyn: number;
}): number {
  const price = createMoney(line.unitPriceTiyn);
  const raw = multiplyMoney(price, line.quantityMilli);
  const discounted = applyDiscount(raw, line.discountTiyn);
  return discounted.amountTiyn;
}

export function calculateOrderTotals(lines: OrderLine[]): {
  subtotalTiyn: number;
  discountTiyn: number;
  totalTiyn: number;
} {
  let subtotalTiyn = 0;
  let discountTiyn = 0;

  for (const line of lines) {
    const price = createMoney(line.unitPriceTiyn);
    const raw = multiplyMoney(price, line.quantityMilli);
    subtotalTiyn += raw.amountTiyn;
    discountTiyn += line.discountTiyn;
  }

  const total = subtotalTiyn - discountTiyn;
  if (total < 0) throw new Error("Total would be negative");

  return { subtotalTiyn, discountTiyn, totalTiyn: total };
}

export function recalculateLine(line: OrderLine): OrderLine {
  return { ...line, lineTotalTiyn: calculateLineTotal(line) };
}

export function recalculateAllLines(lines: OrderLine[]): OrderLine[] {
  return lines.map(recalculateLine);
}

export function buildInvoiceFromOrder(
  orderId: string,
  lines: OrderLine[],
  totals: { subtotalTiyn: number; discountTiyn: number; totalTiyn: number },
): {
  linesSnapshot: OrderLine[];
  subtotalTiyn: number;
  discountTiyn: number;
  totalTiyn: number;
} {
  return {
    linesSnapshot: lines.map((l) => ({ ...l })),
    subtotalTiyn: totals.subtotalTiyn,
    discountTiyn: totals.discountTiyn,
    totalTiyn: totals.totalTiyn,
  };
}
