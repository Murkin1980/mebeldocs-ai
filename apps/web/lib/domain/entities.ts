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

export type AuditEntityType = "company_profile" | "counterparty" | "order" | "invoice" | "payment" | "esf_review";

export type AuditAction =
  | "created"
  | "updated"
  | "confirmed"
  | "cancelled"
  | "pdf_generated"
  | "invoice_created_from_order"
  | "payment_created"
  | "payment_matched"
  | "payment_reversed"
  | "esf_imported"
  | "esf_baseline_confirmed"
  | "esf_final_verified";

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

// ─── Payments ──────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "bank_transfer" | "card";

export type PaymentStatus = "draft" | "matched" | "reversed";

export type Payment = {
  id: string;
  companyId: string;
  date: string; // YYYY-MM-DD
  amountTiyn: number;
  method: PaymentMethod;
  counterpartyId?: string;
  invoiceId?: string; // confirmed link
  invoiceReference?: string; // display/imported text reference
  notes?: string;
  status: PaymentStatus;
  actorId: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMatchEvent = {
  id: string;
  paymentId: string;
  invoiceId: string;
  amountTiyn: number;
  matchedBy: string;
  matchedAt: string;
  idempotencyKey: string;
  reversed?: boolean;
  reversedAt?: string;
  reversedBy?: string;
};

export type InvoiceBalance = {
  invoiceId: string;
  invoiceTotalTiyn: number;
  confirmedPaidTiyn: number;
  remainingTiyn: number;
  status: "unpaid" | "partially_paid" | "paid" | "overpaid";
};

// ─── ESF Review ────────────────────────────────────────────────────

export type EsfFieldStatus = "match" | "warning" | "error" | "not_checked";

export type EsfFieldComparison = {
  fieldName: string;
  expectedValue: string;
  actualValue: string;
  status: EsfFieldStatus;
  explanation: string;
  expectedSource: string;
};

export type EsfReviewStatus = "imported" | "baseline_confirmed" | "final_verified" | "final_mismatch";

export type EsfReview = {
  id: string;
  companyId: string;
  status: EsfReviewStatus;
  // Initial import
  importedXmlFilename: string;
  importedAt: string;
  importedBy: string;
  importedEsfData: EsfExtractedData;
  // Baseline (user-confirmed expected values)
  baseline?: EsfExtractedData;
  baselineConfirmedAt?: string;
  baselineConfirmedBy?: string;
  // Final verification
  finalXmlFilename?: string;
  finalVerifiedAt?: string;
  comparisonFields?: EsfFieldComparison[];
  verificationResult?: "passed" | "warnings" | "errors";
  // Link
  orderId?: string;
  invoiceId?: string;
};

export type EsfExtractedData = {
  esfNumber: string;
  registrationNumber?: string;
  status: string;
  issueDate: string;
  turnoverDate: string;
  sellerName: string;
  sellerBinIin: string;
  buyerName: string;
  buyerBinIin: string;
  totalAmountTiyn: number;
  formatVersion?: string;
};
