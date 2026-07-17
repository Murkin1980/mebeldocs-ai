export type Money = {
  currency: "KZT";
  amountTiyn: number;
};

export function createMoney(tiyn: number): Money {
  if (!Number.isInteger(tiyn) || tiyn < 0) {
    throw new Error(`Invalid tiyn amount: ${tiyn}. Must be a non-negative integer.`);
  }
  return { currency: "KZT", amountTiyn: tiyn };
}

export function tiynToTenge(m: Money): number {
  return m.amountTiyn / 100;
}

export function formatMoney(m: Money): string {
  const tenge = m.amountTiyn / 100;
  return `${tenge.toLocaleString("ru-KZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₸`;
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Cannot add different currencies");
  return createMoney(a.amountTiyn + b.amountTiyn);
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Cannot subtract different currencies");
  const result = a.amountTiyn - b.amountTiyn;
  if (result < 0) throw new Error("Result would be negative");
  return createMoney(result);
}

export function multiplyMoney(m: Money, quantityMilli: number): Money {
  if (!Number.isInteger(quantityMilli) || quantityMilli <= 0) {
    throw new Error(`Invalid quantityMilli: ${quantityMilli}`);
  }
  const result = Math.round((m.amountTiyn * quantityMilli) / 1000);
  return createMoney(result);
}

export function applyDiscount(amount: Money, discountTiyn: number): Money {
  if (!Number.isInteger(discountTiyn) || discountTiyn < 0) {
    throw new Error(`Invalid discount: ${discountTiyn}`);
  }
  if (discountTiyn > amount.amountTiyn) {
    throw new Error("Discount exceeds amount");
  }
  return createMoney(amount.amountTiyn - discountTiyn);
}

export function sumMoney(items: Money[]): Money {
  return createMoney(items.reduce((acc, m) => acc + m.amountTiyn, 0));
}
