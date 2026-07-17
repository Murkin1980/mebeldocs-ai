import { randomUUID } from "node:crypto";
import type { Counterparty } from "../domain/entities";
import type { CounterpartyRepository, AuditEventRepository } from "../domain/repository";

export type CreateCounterpartyInput = {
  name: string;
  binIin?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export class CounterpartyService {
  constructor(
    private repo: CounterpartyRepository,
    private auditRepo: AuditEventRepository,
  ) {}

  async list(): Promise<Counterparty[]> {
    return this.repo.list();
  }

  async get(id: string): Promise<Counterparty | null> {
    return this.repo.get(id);
  }

  async create(input: CreateCounterpartyInput): Promise<Counterparty> {
    const now = new Date().toISOString();
    const counterparty: Counterparty = {
      id: randomUUID(),
      name: input.name,
      binIin: input.binIin,
      address: input.address,
      phone: input.phone,
      email: input.email,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.create(counterparty);

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "counterparty",
      entityId: counterparty.id,
      action: "created",
      actorId: "local_owner",
      occurredAt: now,
      idempotencyKey: `counterparty-create-${counterparty.id}`,
      nextState: { name: counterparty.name },
    });

    return counterparty;
  }

  async update(id: string, data: Partial<CreateCounterpartyInput>): Promise<Counterparty> {
    const existing = await this.repo.get(id);
    if (!existing) throw new Error("Counterparty not found");

    const updated = await this.repo.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    await this.auditRepo.record({
      id: randomUUID(),
      entityType: "counterparty",
      entityId: id,
      action: "updated",
      actorId: "local_owner",
      occurredAt: new Date().toISOString(),
      idempotencyKey: `counterparty-update-${id}-${Date.now()}`,
      previousState: { name: existing.name },
      nextState: { name: updated.name },
    });

    return updated;
  }
}
