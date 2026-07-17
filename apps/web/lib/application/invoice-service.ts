import { randomUUID } from "node:crypto";
import type { Invoice, Order, CompanyProfile, Counterparty } from "../domain/entities";
import type {
  InvoiceRepository,
  OrderRepository,
  CompanyRepository,
  CounterpartyRepository,
  AuditEventRepository,
} from "../domain/repository";
import { validateInvoiceTransition } from "../domain/state-machine";

export class InvoiceService {
  constructor(
    private invoiceRepo: InvoiceRepository,
    private orderRepo: OrderRepository,
    private companyRepo: CompanyRepository,
    private counterpartyRepo: CounterpartyRepository,
    private auditRepo: AuditEventRepository,
  ) {}

  async list(): Promise<Invoice[]> {
    return this.invoiceRepo.list();
  }

  async get(id: string): Promise<Invoice | null> {
    return this.invoiceRepo.get(id);
  }

  async createFromOrder(orderId: string): Promise<Invoice> {
    const order = await this.orderRepo.get(orderId);
    if (!order) throw new Error("Order not found");

    const company = await this.companyRepo.get();
    if (!company) throw new Error("Company profile not found");

    const counterparty = await this.counterpartyRepo.get(order.counterpartyId);
    if (!counterparty) throw new Error("Counterparty not found");

    const number = await this.invoiceRepo.getNextNumber(company.invoiceNumbering.prefix);
    const now = new Date().toISOString();

    const invoice: Invoice = {
      id: randomUUID(),
      orderId: order.id,
      number,
      date: order.date,
      status: "draft",
      version: 1,
      sellerSnapshot: { ...company },
      buyerSnapshot: { ...counterparty },
      linesSnapshot: order.lines.map((l) => ({ ...l })),
      subtotalTiyn: order.subtotalTiyn,
      discountTiyn: order.discountTiyn,
      totalTiyn: order.totalTiyn,
      contractNumber: order.contractNumber,
      contractDate: order.contractDate,
      createdAt: now,
    };

    await this.invoiceRepo.create(invoice);

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "invoice",
      entityId: invoice.id,
      action: "invoice_created_from_order",
      actorId: "local_owner",
      occurredAt: now,
      idempotencyKey: `invoice-from-order-${orderId}-${invoice.id}`,
      metadata: { orderId, invoiceNumber: number },
      nextState: { status: "draft", number, totalTiyn: invoice.totalTiyn },
    });

    return invoice;
  }

  async confirm(id: string): Promise<Invoice> {
    const existing = await this.invoiceRepo.get(id);
    if (!existing) throw new Error("Invoice not found");

    validateInvoiceTransition(existing.status, "confirmed");

    const now = new Date().toISOString();
    const updated = await this.invoiceRepo.update(id, {
      status: "confirmed",
      confirmedAt: now,
      confirmedBy: "local_owner",
    });

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "invoice",
      entityId: id,
      action: "confirmed",
      actorId: "local_owner",
      occurredAt: now,
      idempotencyKey: `invoice-confirm-${id}`,
      previousState: { status: existing.status },
      nextState: { status: "confirmed" },
    });

    return updated;
  }

  async cancel(id: string, reason?: string): Promise<Invoice> {
    const existing = await this.invoiceRepo.get(id);
    if (!existing) throw new Error("Invoice not found");

    validateInvoiceTransition(existing.status, "cancelled");

    const now = new Date().toISOString();
    const updated = await this.invoiceRepo.update(id, { status: "cancelled" });

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "invoice",
      entityId: id,
      action: "cancelled",
      actorId: "local_owner",
      occurredAt: now,
      idempotencyKey: `invoice-cancel-${id}-${Date.now()}`,
      previousState: { status: existing.status },
      nextState: { status: "cancelled" },
      reason,
    });

    return updated;
  }
}
