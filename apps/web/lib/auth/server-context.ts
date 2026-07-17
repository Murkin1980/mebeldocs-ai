import type { Payment } from "../domain/entities";

export type UserRole = "owner" | "accountant" | "observer";

export type PilotUser = {
  userId: string;
  companyId: string;
  name: string;
  role: UserRole;
};

export type ServerContext = {
  user: PilotUser;
};

// Pilot mode: hardcoded single user for development
const PILOT_USER: PilotUser = {
  userId: "pilot-owner-001",
  companyId: "company-grand-mebel",
  name: "Айдос",
  role: "owner",
};

export function getServerContext(): ServerContext {
  return { user: PILOT_USER };
}

export function requireWriteAccess(ctx: ServerContext): void {
  if (ctx.user.role === "observer") {
    throw new AuthError("forbidden", "Недостаточно прав для записи");
  }
}

export function requireReadAccess(_ctx: ServerContext): void {
  // All authenticated users can read in pilot mode
}

export class AuthError extends Error {
  code: "unauthorized" | "forbidden" | "not_found";
  constructor(code: "unauthorized" | "forbidden" | "not_found", message: string) {
    super(message);
    this.code = code;
    this.name = "AuthError";
  }
}

export type PaymentPublicDTO = {
  id: string;
  date: string;
  amountTiyn: number;
  method: string;
  counterpartyId?: string;
  invoiceId?: string;
  invoiceReference?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function sanitizePayment(payment: Payment): PaymentPublicDTO {
  const { companyId, actorId, ...rest } = payment;
  return rest;
}
