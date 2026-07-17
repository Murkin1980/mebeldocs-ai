import type { Money } from "./money";

export type CompanyProfile = {
  id: string;
  legalName: string;
  binIin: string;
  address?: string;
  bankName?: string;
  bik?: string;
  iban?: string;
  phone?: string;
  email?: string;
  directorName?: string;
  activityBasis?: string;
  vatMode: "unknown" | "without_vat" | "vat_payer";
  invoiceNumbering: {
    prefix?: string;
    nextNumber: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type Counterparty = {
  id: string;
  name: string;
  binIin?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderLine = {
  id: string;
  name: string;
  description?: string;
  quantityMilli: number;
  unit: string;
  unitPriceTiyn: number;
  discountTiyn: number;
  lineTotalTiyn: number;
  classification: "goods" | "service" | "unknown";
  dimensions?: string;
  material?: string;
  sortOrder: number;
};

export type OrderStatus = "draft" | "confirmed" | "cancelled";

export type Order = {
  id: string;
  companyId: string;
  counterpartyId: string;
  date: string;
  contractNumber?: string;
  contractDate?: string;
  notes?: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotalTiyn: number;
  discountTiyn: number;
  totalTiyn: number;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceStatus = "draft" | "confirmed" | "posted" | "cancelled";

export type Invoice = {
  id: string;
  orderId: string;
  number: string;
  date: string;
  status: InvoiceStatus;
  version: number;
  sellerSnapshot: CompanyProfile;
  buyerSnapshot: Counterparty;
  linesSnapshot: OrderLine[];
  subtotalTiyn: number;
  discountTiyn: number;
  totalTiyn: number;
  contractNumber?: string;
  contractDate?: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
};

export type AuditEntityType = "company_profile" | "counterparty" | "order" | "invoice";

export type AuditAction =
  | "created"
  | "updated"
  | "confirmed"
  | "cancelled"
  | "pdf_generated"
  | "invoice_created_from_order";

export type AuditEvent = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  actorId: string;
  occurredAt: string;
  idempotencyKey: string;
  previousState?: Record<string, unknown>;
  nextState?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
};
