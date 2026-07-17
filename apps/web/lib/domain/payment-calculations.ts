import type { PaymentMatchEvent, InvoiceBalance } from "./entities";

/**
 * Calculate invoice balance from match events.
 * Sums all non-reversed match amounts and determines payment status.
 */
export function calculateInvoiceBalance(
  invoiceTotalTiyn: number,
  matchEvents: PaymentMatchEvent[],
): InvoiceBalance {
  const confirmedPaidTiyn = matchEvents
    .filter((e) => !e.reversed)
    .reduce((sum, e) => sum + e.amountTiyn, 0);

  const remainingTiyn = invoiceTotalTiyn - confirmedPaidTiyn;

  let status: InvoiceBalance["status"];
  if (confirmedPaidTiyn === 0) {
    status = "unpaid";
  } else if (confirmedPaidTiyn < invoiceTotalTiyn) {
    status = "partially_paid";
  } else if (confirmedPaidTiyn === invoiceTotalTiyn) {
    status = "paid";
  } else {
    status = "overpaid";
  }

  return {
    invoiceId: matchEvents[0]?.invoiceId ?? "",
    invoiceTotalTiyn,
    confirmedPaidTiyn,
    remainingTiyn,
    status,
  };
}

/**
 * Validate that payment amount is a positive integer.
 * Money is always in tiyn (1 KZT = 100 tiyn).
 */
export function validatePaymentAmount(amountTiyn: number): void {
  if (!Number.isInteger(amountTiyn)) {
    throw new Error("Сумма должна быть целым числом в тиынах");
  }
  if (amountTiyn <= 0) {
    throw new Error("Сумма должна быть больше нуля");
  }
}
