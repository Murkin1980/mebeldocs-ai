import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "../../../lib/services";
import {
  getServerContext,
  requireWriteAccess,
  sanitizePayment,
  AuthError,
} from "../../../lib/auth/server-context";
import { validateDateString } from "../../../lib/domain/date-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = getServerContext();
    const payments = await paymentService.listPayments(ctx);
    return NextResponse.json(payments.map(sanitizePayment), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "forbidden" ? 403 : 401 },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message, code: "internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = getServerContext();
    requireWriteAccess(ctx);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid_body", code: "invalid_body" },
        { status: 400 },
      );
    }

    if (!body.date || typeof body.date !== "string") {
      return NextResponse.json(
        { error: "date is required", code: "missing_date" },
        { status: 400 },
      );
    }

    const dateCheck = validateDateString(body.date);
    if (!dateCheck.valid) {
      return NextResponse.json(
        { error: dateCheck.reason!, code: "invalid_date" },
        { status: 400 },
      );
    }

    if (typeof body.amountTiyn !== "number" || body.amountTiyn <= 0) {
      return NextResponse.json(
        { error: "amountTiyn must be a positive number", code: "invalid_amount" },
        { status: 400 },
      );
    }

    if (!body.method || typeof body.method !== "string") {
      return NextResponse.json(
        { error: "method is required", code: "missing_method" },
        { status: 400 },
      );
    }

    const payment = await paymentService.createPayment(ctx, {
      date: body.date,
      amountTiyn: body.amountTiyn,
      method: body.method,
      counterpartyId: body.counterpartyId,
      invoiceReference: body.invoiceReference,
      notes: body.notes,
    });

    return NextResponse.json(sanitizePayment(payment), { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "forbidden" ? 403 : 401 },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message, code: "internal_error" },
      { status: 400 },
    );
  }
}
