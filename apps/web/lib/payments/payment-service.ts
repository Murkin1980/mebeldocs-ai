import { randomUUID } from "node:crypto";
import type { Payment, PaymentMatchEvent, AuditEvent, InvoiceBalance } from "../domain/entities";
import type {
  PaymentRepository,
  PaymentMatchEventRepository,
  InvoiceRepository,
  AuditEventRepository,
} from "../domain/repository";
import type { ServerContext } from "../auth/server-context";
import { validateDateString, isDateNotAfterTodayWithReason } from "../domain/date-utils";
import { validatePaymentAmount, calculateInvoiceBalance } from "../domain/payment-calculations";

type CreatePaymentData = {
  date: string;
  amountTiyn: number;
  method: "cash" | "bank_transfer" | "card";
  counterpartyId?: string;
  invoiceReference?: string;
  notes?: string;
};

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private matchEventRepo: PaymentMatchEventRepository,
    private invoiceRepo: InvoiceRepository,
    private auditRepo: AuditEventRepository,
  ) {}

  async createPayment(
    ctx: ServerContext,
    data: CreatePaymentData,
  ): Promise<Payment> {
    // Validate date: strict YYYY-MM-DD, not future
    const dateValidation = validateDateString(data.date);
    if (!dateValidation.valid) {
      throw new Error(dateValidation.reason);
    }
    const futureCheck = isDateNotAfterTodayWithReason(data.date);
    if (!futureCheck.valid) {
      throw new Error(futureCheck.reason);
    }

    // Validate amount
    validatePaymentAmount(data.amountTiyn);

    const now = new Date().toISOString();
    const payment: Payment = {
      id: randomUUID(),
      companyId: ctx.user.companyId,
      date: data.date,
      amountTiyn: data.amountTiyn,
      method: data.method,
      counterpartyId: data.counterpartyId,
      invoiceReference: data.invoiceReference,
      notes: data.notes,
      status: "draft",
      actorId: ctx.user.userId,
      createdAt: now,
      updatedAt: now,
    };

    await this.paymentRepo.create(payment);
    await this.recordAudit(ctx, "payment_created", payment.id, undefined, {
      date: payment.date,
      amountTiyn: payment.amountTiyn,
      method: payment.method,
    });

    return payment;
  }

  async getPayment(
    ctx: ServerContext,
    paymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepo.get(paymentId);
    if (!payment) {
      throw new Error("payment_not_found");
    }
    if (payment.companyId !== ctx.user.companyId) {
      throw new Error("not_found");
    }
    return payment;
  }

  async listPayments(ctx: ServerContext): Promise<Payment[]> {
    return this.paymentRepo.list(ctx.user.companyId);
  }

  async matchPayment(
    ctx: ServerContext,
    paymentId: string,
    invoiceId: string,
    idempotencyKey: string,
  ): Promise<PaymentMatchEvent> {
    // Check idempotency
    const existing = await this.matchEventRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    // Get and validate payment
    const payment = await this.getPayment(ctx, paymentId);

    // Verify invoice exists and belongs to same company
    const invoice = await this.invoiceRepo.get(invoiceId);
    if (!invoice) {
      throw new Error("invoice_not_found");
    }

    // Create match event
    const now = new Date().toISOString();
    const matchEvent: PaymentMatchEvent = {
      id: randomUUID(),
      paymentId,
      invoiceId,
      amountTiyn: payment.amountTiyn,
      matchedBy: ctx.user.userId,
      matchedAt: now,
      idempotencyKey,
    };

    await this.matchEventRepo.create(matchEvent);

    // Update payment status
    await this.paymentRepo.update(paymentId, {
      status: "matched",
      invoiceId,
      updatedAt: now,
    });

    // Audit
    await this.recordAudit(ctx, "payment_matched", paymentId, invoiceId, {
      matchEventId: matchEvent.id,
      amountTiyn: payment.amountTiyn,
    });

    return matchEvent;
  }

  async reversePayment(
    ctx: ServerContext,
    paymentId: string,
    reason: string,
    idempotencyKey: string,
  ): Promise<Payment> {
    // Check idempotency via audit events
    const existingAudit = await this.auditRepo.findByIdempotencyKey(idempotencyKey);
    if (existingAudit) {
      return this.getPayment(ctx, paymentId);
    }

    // Get and validate payment
    const payment = await this.getPayment(ctx, paymentId);
    if (payment.status === "reversed") {
      throw new Error("payment_already_reversed");
    }

    // Mark all match events as reversed
    const matchEvents = await this.matchEventRepo.listForPayment(paymentId);
    const now = new Date().toISOString();
    for (const event of matchEvents) {
      if (!event.reversed) {
        await this.matchEventRepo.create({
          ...event,
          reversed: true,
          reversedAt: now,
          reversedBy: ctx.user.userId,
        });
      }
    }

    // Update payment status
    const updated = await this.paymentRepo.update(paymentId, {
      status: "reversed",
      invoiceId: undefined,
      updatedAt: now,
    });

    // Audit
    await this.recordAudit(ctx, "payment_reversed", paymentId, undefined, {
      reason,
      reversedMatchEvents: matchEvents.length,
    });

    return updated;
  }

  async getInvoiceBalance(
    ctx: ServerContext,
    invoiceId: string,
  ): Promise<InvoiceBalance> {
    const invoice = await this.invoiceRepo.get(invoiceId);
    if (!invoice) {
      throw new Error("invoice_not_found");
    }

    const matchEvents = await this.matchEventRepo.listForInvoice(invoiceId);
    return calculateInvoiceBalance(invoice.totalTiyn, matchEvents);
  }

  private async recordAudit(
    ctx: ServerContext,
    action: "payment_created" | "payment_matched" | "payment_reversed",
    paymentId: string,
    invoiceId: string | undefined,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const event: AuditEvent = {
      id: randomUUID(),
      entityType: "payment",
      entityId: paymentId,
      action,
      actorId: ctx.user.userId,
      occurredAt: new Date().toISOString(),
      idempotencyKey: randomUUID(),
      metadata: { ...metadata, invoiceId },
    };
    await this.auditRepo.record(event);
  }
}
