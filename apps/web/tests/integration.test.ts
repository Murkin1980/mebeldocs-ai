import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { CompanyProfileService } from "../lib/application/company-profile.ts";
import { CounterpartyService } from "../lib/application/counterparty-service.ts";
import { OrderService } from "../lib/application/order-service.ts";
import { InvoiceService } from "../lib/application/invoice-service.ts";

import type {
  CompanyProfile,
  Counterparty,
  Order,
  Invoice,
  AuditEvent,
} from "../lib/domain/entities.ts";
import type {
  CompanyRepository,
  CounterpartyRepository,
  OrderRepository,
  InvoiceRepository,
  AuditEventRepository,
} from "../lib/domain/repository.ts";

// ─── In-memory repository implementations ───────────────────────────

class MemCompanyRepo implements CompanyRepository {
  private profile: CompanyProfile | null = null;
  async get(): Promise<CompanyProfile | null> {
    return this.profile;
  }
  async save(p: CompanyProfile): Promise<CompanyProfile> {
    this.profile = p;
    return p;
  }
}

class MemCounterpartyRepo implements CounterpartyRepository {
  private store = new Map<string, Counterparty>();
  async list(): Promise<Counterparty[]> {
    return [...this.store.values()];
  }
  async get(id: string): Promise<Counterparty | null> {
    return this.store.get(id) ?? null;
  }
  async create(c: Counterparty): Promise<Counterparty> {
    this.store.set(c.id, c);
    return c;
  }
  async update(id: string, data: Partial<Counterparty>): Promise<Counterparty> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Counterparty ${id} not found`);
    const updated = { ...existing, ...data, id };
    this.store.set(id, updated);
    return updated;
  }
}

class MemOrderRepo implements OrderRepository {
  private store = new Map<string, Order>();
  async list(): Promise<Order[]> {
    return [...this.store.values()].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
  }
  async get(id: string): Promise<Order | null> {
    return this.store.get(id) ?? null;
  }
  async create(o: Order): Promise<Order> {
    this.store.set(o.id, o);
    return o;
  }
  async update(id: string, data: Partial<Order>): Promise<Order> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Order ${id} not found`);
    const updated = { ...existing, ...data, id };
    this.store.set(id, updated);
    return updated;
  }
}

class MemInvoiceRepo implements InvoiceRepository {
  private store = new Map<string, Invoice>();
  private nextNumber = 1;
  async list(): Promise<Invoice[]> {
    return [...this.store.values()].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
  }
  async get(id: string): Promise<Invoice | null> {
    return this.store.get(id) ?? null;
  }
  async create(inv: Invoice): Promise<Invoice> {
    this.store.set(inv.id, inv);
    return inv;
  }
  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Invoice ${id} not found`);
    const updated = { ...existing, ...data, id };
    this.store.set(id, updated);
    return updated;
  }
  async getNextNumber(prefix?: string): Promise<string> {
    const num = this.nextNumber;
    this.nextNumber++;
    const pfx = prefix ?? "";
    return `${pfx}${String(num).padStart(4, "0")}`;
  }
}

class MemAuditRepo implements AuditEventRepository {
  private store = new Map<string, AuditEvent>();
  private byKey = new Map<string, string>();
  async list(): Promise<AuditEvent[]> {
    return [...this.store.values()];
  }
  async record(event: AuditEvent): Promise<AuditEvent> {
    const existing = this.byKey.get(event.idempotencyKey);
    if (existing) return this.store.get(existing)!;
    this.store.set(event.id, event);
    this.byKey.set(event.idempotencyKey, event.id);
    return event;
  }
  async findByIdempotencyKey(key: string): Promise<AuditEvent | null> {
    const id = this.byKey.get(key);
    if (!id) return null;
    return this.store.get(id) ?? null;
  }
}

// ─── Setup helper ───────────────────────────────────────────────────

function setup() {
  const companyRepo = new MemCompanyRepo();
  const counterpartyRepo = new MemCounterpartyRepo();
  const orderRepo = new MemOrderRepo();
  const invoiceRepo = new MemInvoiceRepo();
  const auditRepo = new MemAuditRepo();

  const companyService = new CompanyProfileService(companyRepo);
  const counterpartyService = new CounterpartyService(
    counterpartyRepo,
    auditRepo,
  );
  const orderService = new OrderService(
    orderRepo,
    counterpartyRepo,
    auditRepo,
  );
  const invoiceService = new InvoiceService(
    invoiceRepo,
    orderRepo,
    companyRepo,
    counterpartyRepo,
    auditRepo,
  );

  return {
    repos: { companyRepo, counterpartyRepo, orderRepo, invoiceRepo, auditRepo },
    services: { companyService, counterpartyService, orderService, invoiceService },
  };
}

// ─── 1. Company profile flow ────────────────────────────────────────

test("company profile: create, read, update, verify persistence", async () => {
  const { services } = setup();

  const created = await services.companyService.createOrUpdate({
    legalName: "Тест Мебель",
    binIin: "123456789012",
  });
  assert.equal(created.legalName, "Тест Мебель");
  assert.equal(created.binIin, "123456789012");

  const read = await services.companyService.get();
  assert.ok(read);
  assert.equal(read.legalName, "Тест Мебель");
  assert.equal(read.binIin, "123456789012");

  const updated = await services.companyService.createOrUpdate({
    legalName: "Тест Мебель 2",
  });
  assert.equal(updated.legalName, "Тест Мебель 2");
  assert.equal(updated.binIin, "123456789012");

  const readAgain = await services.companyService.get();
  assert.ok(readAgain);
  assert.equal(readAgain.legalName, "Тест Мебель 2");
});

// ─── 2. Counterparty flow ───────────────────────────────────────────

test("counterparty: create, list, get by id", async () => {
  const { services } = setup();

  const cp = await services.counterpartyService.create({
    name: "Поставщик ООО",
  });
  assert.equal(cp.name, "Поставщик ООО");
  assert.ok(cp.id);

  const list = await services.counterpartyService.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, "Поставщик ООО");

  const byId = await services.counterpartyService.get(cp.id);
  assert.ok(byId);
  assert.equal(byId.id, cp.id);
  assert.equal(byId.name, "Поставщик ООО");
});

// ─── 3. Full order → invoice → confirm flow ─────────────────────────

test("full order → invoice → confirm flow", async () => {
  const { repos, services } = setup();

  const company = await services.companyService.createOrUpdate({
    legalName: "Тест Мебель",
    binIin: "123456789012",
  });

  const cp = await services.counterpartyService.create({
    name: "Поставщик ООО",
  });

  const order = await services.orderService.create(company.id, {
    counterpartyId: cp.id,
    date: "2025-07-18",
    lines: [
      {
        name: "Стол обеденный",
        unit: "шт",
        quantityMilli: 1000,
        unitPriceTiyn: 50000000,
        discountTiyn: 0,
        classification: "goods",
      },
      {
        name: "Стул офисный",
        unit: "шт",
        quantityMilli: 4000,
        unitPriceTiyn: 15000000,
        discountTiyn: 0,
        classification: "goods",
      },
    ],
  });

  assert.equal(order.status, "draft");
  assert.equal(order.subtotalTiyn, 110000000);
  assert.equal(order.totalTiyn, 110000000);
  assert.equal(order.lines.length, 2);

  const confirmed = await services.orderService.confirm(order.id);
  assert.equal(confirmed.status, "confirmed");

  await assert.rejects(
    () => services.orderService.confirm(order.id),
    { message: /Invalid order transition/ },
  );

  const invoice = await services.invoiceService.createFromOrder(order.id);
  assert.equal(invoice.status, "draft");
  assert.equal(invoice.sellerSnapshot.legalName, "Тест Мебель");
  assert.equal(invoice.buyerSnapshot.name, "Поставщик ООО");
  assert.equal(invoice.linesSnapshot.length, 2);
  assert.equal(invoice.linesSnapshot[0].name, "Стол обеденный");
  assert.equal(invoice.linesSnapshot[1].name, "Стул офисный");
  assert.equal(invoice.subtotalTiyn, 110000000);
  assert.equal(invoice.totalTiyn, 110000000);

  const invConfirmed = await services.invoiceService.confirm(invoice.id);
  assert.equal(invConfirmed.status, "confirmed");

  await assert.rejects(
    () => services.invoiceService.confirm(invoice.id),
    { message: /Invalid invoice transition/ },
  );

  const events = await repos.auditRepo.list();
  const entityEvents = events.filter(
    (e) => e.entityId === order.id || e.entityId === invoice.id,
  );
  assert.ok(entityEvents.length >= 3, `Expected >= 3 audit events, got ${entityEvents.length}`);

  const actions = entityEvents.map((e) => e.action);
  assert.ok(actions.includes("created"), "missing 'created' audit event");
  assert.ok(actions.includes("confirmed"), "missing 'confirmed' audit event");
  assert.ok(
    actions.includes("invoice_created_from_order"),
    "missing 'invoice_created_from_order' audit event",
  );
});

// ─── 4. Order cancellation ──────────────────────────────────────────

test("order cancellation: from confirmed, from draft, double-cancel throws", async () => {
  const { services } = setup();

  const company = await services.companyService.createOrUpdate({
    legalName: "Тест Мебель",
    binIin: "123456789012",
  });
  const cp = await services.counterpartyService.create({
    name: "Поставщик ООО",
  });

  const order1 = await services.orderService.create(company.id, {
    counterpartyId: cp.id,
    date: "2025-07-18",
    lines: [
      {
        name: "Стол обеденный",
        unit: "шт",
        quantityMilli: 1000,
        unitPriceTiyn: 50000000,
        discountTiyn: 0,
        classification: "goods",
      },
    ],
  });
  await services.orderService.confirm(order1.id);
  const cancelled1 = await services.orderService.cancel(order1.id);
  assert.equal(cancelled1.status, "cancelled");

  await assert.rejects(
    () => services.orderService.cancel(order1.id),
    { message: /Invalid order transition/ },
  );

  const order2 = await services.orderService.create(company.id, {
    counterpartyId: cp.id,
    date: "2025-07-18",
    lines: [
      {
        name: "Стул офисный",
        unit: "шт",
        quantityMilli: 2000,
        unitPriceTiyn: 15000000,
        discountTiyn: 0,
        classification: "goods",
      },
    ],
  });
  const cancelled2 = await services.orderService.cancel(order2.id);
  assert.equal(cancelled2.status, "cancelled");

  await assert.rejects(
    () => services.orderService.cancel(order2.id),
    { message: /Invalid order transition/ },
  );
});

// ─── 5. Idempotency check ──────────────────────────────────────────

test("audit event idempotency: duplicate key returns original", async () => {
  const { repos } = setup();

  const key = `order-create-${randomUUID()}`;
  const event1: AuditEvent = {
    id: randomUUID(),
    entityType: "order",
    entityId: randomUUID(),
    action: "created",
    actorId: "local_owner",
    occurredAt: new Date().toISOString(),
    idempotencyKey: key,
  };

  await repos.auditRepo.record(event1);

  const event2: AuditEvent = {
    id: randomUUID(),
    entityType: "order",
    entityId: event1.entityId,
    action: "created",
    actorId: "local_owner",
    occurredAt: new Date().toISOString(),
    idempotencyKey: key,
  };

  const result = await repos.auditRepo.record(event2);
  assert.equal(result.id, event1.id);

  const all = await repos.auditRepo.list();
  assert.equal(all.length, 1);

  const found = await repos.auditRepo.findByIdempotencyKey(key);
  assert.ok(found);
  assert.equal(found.id, event1.id);
});

// ─── 6. Invoice not found errors ────────────────────────────────────

test("invoice not found: get returns null, confirm throws", async () => {
  const { services } = setup();

  const missing = await services.invoiceService.get(randomUUID());
  assert.equal(missing, null);

  await assert.rejects(
    () => services.invoiceService.confirm(randomUUID()),
    { message: /Invoice not found/ },
  );
});
