import type { InvoiceStatus, OrderStatus } from "./entities";

const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

const invoiceTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["posted", "cancelled"],
  posted: [],
  cancelled: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return orderTransitions[from].includes(to);
}

export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return invoiceTransitions[from].includes(to);
}

export function validateOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`Invalid order transition: ${from} → ${to}`);
  }
}

export function validateInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!canTransitionInvoice(from, to)) {
    throw new Error(`Invalid invoice transition: ${from} → ${to}`);
  }
}

export function getAllowedOrderTransitions(status: OrderStatus): OrderStatus[] {
  return orderTransitions[status];
}

export function getAllowedInvoiceTransitions(status: InvoiceStatus): InvoiceStatus[] {
  return invoiceTransitions[status];
}
