import { randomUUID } from "node:crypto";
import type { Order, OrderLine, OrderStatus } from "../domain/entities";
import type { OrderRepository, CounterpartyRepository, AuditEventRepository } from "../domain/repository";
import { calculateOrderTotals, recalculateAllLines } from "../domain/calculations";
import { validateOrderTransition } from "../domain/state-machine";

export type CreateOrderInput = {
  counterpartyId: string;
  date: string;
  contractNumber?: string;
  contractDate?: string;
  notes?: string;
  lines: Omit<OrderLine, "id" | "sortOrder" | "lineTotalTiyn">[];
};

export type UpdateOrderInput = {
  counterpartyId?: string;
  date?: string;
  contractNumber?: string;
  contractDate?: string;
  notes?: string;
  lines?: Omit<OrderLine, "id" | "sortOrder" | "lineTotalTiyn">[];
};

export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private counterpartyRepo: CounterpartyRepository,
    private auditRepo: AuditEventRepository,
  ) {}

  async list(): Promise<Order[]> {
    return this.orderRepo.list();
  }

  async get(id: string): Promise<Order | null> {
    return this.orderRepo.get(id);
  }

  async create(companyId: string, input: CreateOrderInput): Promise<Order> {
    const counterparty = await this.counterpartyRepo.get(input.counterpartyId);
    if (!counterparty) throw new Error("Counterparty not found");

    const lines: OrderLine[] = input.lines.map((l, i) => ({
      ...l,
      id: randomUUID(),
      sortOrder: i,
      lineTotalTiyn: 0,
    }));

    const recalculated = recalculateAllLines(lines);
    const totals = calculateOrderTotals(recalculated);

    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      companyId,
      counterpartyId: input.counterpartyId,
      date: input.date,
      contractNumber: input.contractNumber,
      contractDate: input.contractDate,
      notes: input.notes,
      status: "draft",
      lines: recalculated,
      subtotalTiyn: totals.subtotalTiyn,
      discountTiyn: totals.discountTiyn,
      totalTiyn: totals.totalTiyn,
      createdAt: now,
      updatedAt: now,
    };

    await this.orderRepo.create(order);

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "order",
      entityId: order.id,
      action: "created",
      actorId: "local_owner",
      occurredAt: now,
      idempotencyKey: `order-create-${order.id}`,
      nextState: { status: "draft", totalTiyn: order.totalTiyn },
    });

    return order;
  }

  async update(id: string, input: UpdateOrderInput): Promise<Order> {
    const existing = await this.orderRepo.get(id);
    if (!existing) throw new Error("Order not found");
    if (existing.status !== "draft") throw new Error("Can only update draft orders");

    const lines = input.lines
      ? input.lines.map((l, i) => ({
          ...l,
          id: randomUUID(),
          sortOrder: i,
          lineTotalTiyn: 0,
        }))
      : existing.lines;

    const recalculated = recalculateAllLines(lines);
    const totals = calculateOrderTotals(recalculated);

    const updated = await this.orderRepo.update(id, {
      ...input,
      lines: recalculated,
      subtotalTiyn: totals.subtotalTiyn,
      discountTiyn: totals.discountTiyn,
      totalTiyn: totals.totalTiyn,
    });

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "order",
      entityId: id,
      action: "updated",
      actorId: "local_owner",
      occurredAt: new Date().toISOString(),
      idempotencyKey: `order-update-${id}-${Date.now()}`,
      previousState: { status: existing.status },
      nextState: { status: updated.status },
    });

    return updated;
  }

  async confirm(id: string): Promise<Order> {
    const existing = await this.orderRepo.get(id);
    if (!existing) throw new Error("Order not found");

    validateOrderTransition(existing.status, "confirmed");

    const updated = await this.orderRepo.update(id, { status: "confirmed" });

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "order",
      entityId: id,
      action: "confirmed",
      actorId: "local_owner",
      occurredAt: new Date().toISOString(),
      idempotencyKey: `order-confirm-${id}`,
      previousState: { status: existing.status },
      nextState: { status: "confirmed" },
    });

    return updated;
  }

  async cancel(id: string, reason?: string): Promise<Order> {
    const existing = await this.orderRepo.get(id);
    if (!existing) throw new Error("Order not found");

    validateOrderTransition(existing.status, "cancelled");

    const updated = await this.orderRepo.update(id, { status: "cancelled" });

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "order",
      entityId: id,
      action: "cancelled",
      actorId: "local_owner",
      occurredAt: new Date().toISOString(),
      idempotencyKey: `order-cancel-${id}-${Date.now()}`,
      previousState: { status: existing.status },
      nextState: { status: "cancelled" },
      reason,
    });

    return updated;
  }
}
