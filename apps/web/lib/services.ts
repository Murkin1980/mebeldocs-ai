import {
  LocalCompanyRepository,
  LocalCounterpartyRepository,
  LocalOrderRepository,
  LocalInvoiceRepository,
  LocalAuditEventRepository,
  LocalPdfStorage,
  LocalPaymentRepository,
  LocalPaymentMatchEventRepository,
  LocalEsfReviewRepository,
} from "./storage/local-repositories";
import { CompanyProfileService } from "./application/company-profile";
import { CounterpartyService } from "./application/counterparty-service";
import { OrderService } from "./application/order-service";
import { InvoiceService } from "./application/invoice-service";
import { PaymentService } from "./payments/payment-service";
import { EsfReviewService } from "./esf/review-service";

const companyRepo = new LocalCompanyRepository();
const counterpartyRepo = new LocalCounterpartyRepository();
const orderRepo = new LocalOrderRepository();
const invoiceRepo = new LocalInvoiceRepository();
const auditRepo = new LocalAuditEventRepository();
const pdfStorage = new LocalPdfStorage();
const paymentRepo = new LocalPaymentRepository();
const paymentMatchEventRepo = new LocalPaymentMatchEventRepository();
const esfReviewRepo = new LocalEsfReviewRepository();

export const companyService = new CompanyProfileService(companyRepo);
export const counterpartyService = new CounterpartyService(counterpartyRepo, auditRepo);
export const orderService = new OrderService(orderRepo, counterpartyRepo, auditRepo);
export const invoiceService = new InvoiceService(invoiceRepo, orderRepo, companyRepo, counterpartyRepo, auditRepo);
export const paymentService = new PaymentService(paymentRepo, paymentMatchEventRepo, invoiceRepo, auditRepo);
export const esfReviewService = new EsfReviewService(esfReviewRepo, auditRepo);

export {
  companyRepo,
  counterpartyRepo,
  orderRepo,
  invoiceRepo,
  auditRepo,
  pdfStorage,
  paymentRepo,
  paymentMatchEventRepo,
  esfReviewRepo,
};
