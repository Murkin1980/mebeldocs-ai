import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CompanyProfile, Counterparty, Order, Invoice, AuditEvent, Payment, PaymentMatchEvent, EsfReview } from "../domain/entities";
import type {
  CompanyRepository,
  CounterpartyRepository,
  OrderRepository,
  InvoiceRepository,
  AuditEventRepository,
  PdfStorage,
  PaymentRepository,
  PaymentMatchEventRepository,
  EsfReviewRepository,
} from "../domain/repository";

function dataDir(): string {
  return path.resolve(process.cwd(), "../..", "data", "working", "docs");
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ─── Company ───────────────────────────────────────────────────────

function companyFile(): string {
  return path.join(dataDir(), "company-profile.json");
}

export class LocalCompanyRepository implements CompanyRepository {
  async get(): Promise<CompanyProfile | null> {
    return readJsonFile<CompanyProfile>(companyFile());
  }
  async save(profile: CompanyProfile): Promise<CompanyProfile> {
    await writeJsonFile(companyFile(), profile);
    return profile;
  }
}

// ─── Counterparty ──────────────────────────────────────────────────

function counterpartiesDir(): string {
  return path.join(dataDir(), "counterparties");
}

export class LocalCounterpartyRepository implements CounterpartyRepository {
  async list(): Promise<Counterparty[]> {
    const dir = counterpartiesDir();
    try {
      const files = await readdir(dir);
      const items: Counterparty[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const item = await readJsonFile<Counterparty>(path.join(dir, file));
        if (item) items.push(item);
      }
      return items;
    } catch {
      return [];
    }
  }
  async get(id: string): Promise<Counterparty | null> {
    return readJsonFile<Counterparty>(path.join(counterpartiesDir(), `${id}.json`));
  }
  async create(counterparty: Counterparty): Promise<Counterparty> {
    await writeJsonFile(path.join(counterpartiesDir(), `${counterparty.id}.json`), counterparty);
    return counterparty;
  }
  async update(id: string, data: Partial<Counterparty>): Promise<Counterparty> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Counterparty ${id} not found`);
    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await writeJsonFile(path.join(counterpartiesDir(), `${id}.json`), updated);
    return updated;
  }
}

// ─── Order ─────────────────────────────────────────────────────────

function ordersDir(): string {
  return path.join(dataDir(), "orders");
}

export class LocalOrderRepository implements OrderRepository {
  async list(): Promise<Order[]> {
    const dir = ordersDir();
    try {
      const files = await readdir(dir);
      const items: Order[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const item = await readJsonFile<Order>(path.join(dir, file));
        if (item) items.push(item);
      }
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }
  async get(id: string): Promise<Order | null> {
    return readJsonFile<Order>(path.join(ordersDir(), `${id}.json`));
  }
  async create(order: Order): Promise<Order> {
    await writeJsonFile(path.join(ordersDir(), `${order.id}.json`), order);
    return order;
  }
  async update(id: string, data: Partial<Order>): Promise<Order> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Order ${id} not found`);
    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await writeJsonFile(path.join(ordersDir(), `${id}.json`), updated);
    return updated;
  }
}

// ─── Invoice ───────────────────────────────────────────────────────

function invoicesDir(): string {
  return path.join(dataDir(), "invoices");
}

function numberingFile(): string {
  return path.join(dataDir(), "invoice-numbering.json");
}

export class LocalInvoiceRepository implements InvoiceRepository {
  async list(): Promise<Invoice[]> {
    const dir = invoicesDir();
    try {
      const files = await readdir(dir);
      const items: Invoice[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const item = await readJsonFile<Invoice>(path.join(dir, file));
        if (item) items.push(item);
      }
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }
  async get(id: string): Promise<Invoice | null> {
    return readJsonFile<Invoice>(path.join(invoicesDir(), `${id}.json`));
  }
  async create(invoice: Invoice): Promise<Invoice> {
    await writeJsonFile(path.join(invoicesDir(), `${invoice.id}.json`), invoice);
    return invoice;
  }
  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Invoice ${id} not found`);
    const updated = { ...existing, ...data, id };
    await writeJsonFile(path.join(invoicesDir(), `${id}.json`), updated);
    return updated;
  }
  async getNextNumber(prefix?: string): Promise<string> {
    const file = numberingFile();
    const data = (await readJsonFile<{ nextNumber: number }>(file)) ?? { nextNumber: 1 };
    const number = data.nextNumber;
    await writeJsonFile(file, { nextNumber: number + 1 });
    const pfx = prefix ?? "";
    return `${pfx}${String(number).padStart(4, "0")}`;
  }
}

// ─── Audit Events ──────────────────────────────────────────────────

function auditDir(): string {
  return path.join(dataDir(), "audit-events");
}

export class LocalAuditEventRepository implements AuditEventRepository {
  async list(): Promise<AuditEvent[]> {
    const dir = auditDir();
    try {
      const files = await readdir(dir);
      const events: AuditEvent[] = [];
      for (const file of files.filter((f) => f.endsWith(".json")).sort()) {
        const event = await readJsonFile<AuditEvent>(path.join(dir, file));
        if (event) events.push(event);
      }
      return events;
    } catch {
      return [];
    }
  }
  async record(event: AuditEvent): Promise<AuditEvent> {
    const filePath = path.join(auditDir(), `${event.id}.json`);
    await writeJsonFile(filePath, event);
    return event;
  }
  async findByIdempotencyKey(key: string): Promise<AuditEvent | null> {
    const events = await this.list();
    return events.find((e) => e.idempotencyKey === key) ?? null;
  }
}

// ─── PDF Storage ───────────────────────────────────────────────────

function pdfDir(): string {
  return path.join(dataDir(), "pdfs");
}

export class LocalPdfStorage implements PdfStorage {
  async savePdf(invoiceId: string, buffer: Buffer): Promise<string> {
    const dir = pdfDir();
    await ensureDir(dir);
    const filePath = path.join(dir, `${invoiceId}.pdf`);
    await writeFile(filePath, buffer);
    return filePath;
  }
  async getPdf(invoiceId: string): Promise<Buffer | null> {
    try {
      return await readFile(path.join(pdfDir(), `${invoiceId}.pdf`));
    } catch {
      return null;
    }
  }
  async getPdfPath(invoiceId: string): Promise<string | null> {
    try {
      const filePath = path.join(pdfDir(), `${invoiceId}.pdf`);
      await readFile(filePath);
      return filePath;
    } catch {
      return null;
    }
  }
}

// ─── Payment ───────────────────────────────────────────────────────

function paymentsDir(): string {
  return path.join(dataDir(), "payments");
}

export class LocalPaymentRepository implements PaymentRepository {
  async list(companyId: string): Promise<Payment[]> {
    const dir = paymentsDir();
    try {
      const files = await readdir(dir);
      const items: Payment[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const item = await readJsonFile<Payment>(path.join(dir, file));
        if (item && item.companyId === companyId) items.push(item);
      }
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<Payment | null> {
    return readJsonFile<Payment>(path.join(paymentsDir(), `${id}.json`));
  }

  async create(payment: Payment): Promise<Payment> {
    await writeJsonFile(path.join(paymentsDir(), `${payment.id}.json`), payment);
    return payment;
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Payment ${id} not found`);
    const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    await writeJsonFile(path.join(paymentsDir(), `${id}.json`), updated);
    return updated;
  }
}

// ─── Payment Match Events ──────────────────────────────────────────

function paymentMatchEventsDir(): string {
  return path.join(dataDir(), "payment-match-events");
}

export class LocalPaymentMatchEventRepository implements PaymentMatchEventRepository {
  async listForPayment(paymentId: string): Promise<PaymentMatchEvent[]> {
    const dir = paymentMatchEventsDir();
    try {
      const files = await readdir(dir);
      const events: PaymentMatchEvent[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const event = await readJsonFile<PaymentMatchEvent>(path.join(dir, file));
        if (event && event.paymentId === paymentId) events.push(event);
      }
      return events.sort((a, b) => a.matchedAt.localeCompare(b.matchedAt));
    } catch {
      return [];
    }
  }

  async listForInvoice(invoiceId: string): Promise<PaymentMatchEvent[]> {
    const dir = paymentMatchEventsDir();
    try {
      const files = await readdir(dir);
      const events: PaymentMatchEvent[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const event = await readJsonFile<PaymentMatchEvent>(path.join(dir, file));
        if (event && event.invoiceId === invoiceId) events.push(event);
      }
      return events.sort((a, b) => a.matchedAt.localeCompare(b.matchedAt));
    } catch {
      return [];
    }
  }

  async create(event: PaymentMatchEvent): Promise<PaymentMatchEvent> {
    await writeJsonFile(path.join(paymentMatchEventsDir(), `${event.id}.json`), event);
    return event;
  }

  async findByIdempotencyKey(key: string): Promise<PaymentMatchEvent | null> {
    const dir = paymentMatchEventsDir();
    try {
      const files = await readdir(dir);
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const event = await readJsonFile<PaymentMatchEvent>(path.join(dir, file));
        if (event && event.idempotencyKey === key) return event;
      }
      return null;
    } catch {
      return null;
    }
  }
}

// ─── ESF Review ────────────────────────────────────────────────────

function esfReviewsDir(): string {
  return path.join(dataDir(), "esf-reviews");
}

export class LocalEsfReviewRepository implements EsfReviewRepository {
  async list(companyId: string): Promise<EsfReview[]> {
    const dir = esfReviewsDir();
    try {
      const files = await readdir(dir);
      const items: EsfReview[] = [];
      for (const file of files.filter((f) => f.endsWith(".json"))) {
        const item = await readJsonFile<EsfReview>(path.join(dir, file));
        if (item && item.companyId === companyId) items.push(item);
      }
      return items.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<EsfReview | null> {
    return readJsonFile<EsfReview>(path.join(esfReviewsDir(), `${id}.json`));
  }

  async create(review: EsfReview): Promise<EsfReview> {
    await writeJsonFile(path.join(esfReviewsDir(), `${review.id}.json`), review);
    return review;
  }

  async update(id: string, data: Partial<EsfReview>): Promise<EsfReview> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`EsfReview ${id} not found`);
    const updated = { ...existing, ...data, id };
    await writeJsonFile(path.join(esfReviewsDir(), `${id}.json`), updated);
    return updated;
  }
}
