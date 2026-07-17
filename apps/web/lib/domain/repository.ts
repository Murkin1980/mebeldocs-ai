import type { CompanyProfile, Counterparty, Order, Invoice, AuditEvent, Payment, PaymentMatchEvent, EsfReview } from "./entities";

export interface CompanyRepository {
  get(): Promise<CompanyProfile | null>;
  save(profile: CompanyProfile): Promise<CompanyProfile>;
}

export interface CounterpartyRepository {
  list(): Promise<Counterparty[]>;
  get(id: string): Promise<Counterparty | null>;
  create(counterparty: Counterparty): Promise<Counterparty>;
  update(id: string, data: Partial<Counterparty>): Promise<Counterparty>;
}

export interface OrderRepository {
  list(): Promise<Order[]>;
  get(id: string): Promise<Order | null>;
  create(order: Order): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
}

export interface InvoiceRepository {
  list(): Promise<Invoice[]>;
  get(id: string): Promise<Invoice | null>;
  create(invoice: Invoice): Promise<Invoice>;
  update(id: string, data: Partial<Invoice>): Promise<Invoice>;
  getNextNumber(prefix?: string): Promise<string>;
}

export interface AuditEventRepository {
  list(): Promise<AuditEvent[]>;
  record(event: AuditEvent): Promise<AuditEvent>;
  findByIdempotencyKey(key: string): Promise<AuditEvent | null>;
}

export interface PdfStorage {
  savePdf(invoiceId: string, buffer: Buffer): Promise<string>;
  getPdf(invoiceId: string): Promise<Buffer | null>;
  getPdfPath(invoiceId: string): Promise<string | null>;
}

export interface PaymentRepository {
  list(companyId: string): Promise<Payment[]>;
  get(id: string): Promise<Payment | null>;
  create(payment: Payment): Promise<Payment>;
  update(id: string, data: Partial<Payment>): Promise<Payment>;
}

export interface PaymentMatchEventRepository {
  listForPayment(paymentId: string): Promise<PaymentMatchEvent[]>;
  listForInvoice(invoiceId: string): Promise<PaymentMatchEvent[]>;
  create(event: PaymentMatchEvent): Promise<PaymentMatchEvent>;
  findByIdempotencyKey(key: string): Promise<PaymentMatchEvent | null>;
}

export interface EsfReviewRepository {
  list(companyId: string): Promise<EsfReview[]>;
  get(id: string): Promise<EsfReview | null>;
  create(review: EsfReview): Promise<EsfReview>;
  update(id: string, data: Partial<EsfReview>): Promise<EsfReview>;
}
