import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "../../../../../lib/services";
import {
  getServerContext,
  requireWriteAccess,
  AuthError,
} from "../../../../../lib/auth/server-context";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const ctx = getServerContext();
    requireWriteAccess(ctx);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid_body", code: "invalid_body" },
        { status: 400 },
      );
    }

    if (!body.invoiceId || typeof body.invoiceId !== "string") {
      return NextResponse.json(
        { error: "invoiceId is required", code: "missing_invoice_id" },
        { status: 400 },
      );
    }

    if (!body.idempotencyKey || typeof body.idempotencyKey !== "string") {
      return NextResponse.json(
        { error: "idempotencyKey is required", code: "missing_idempotency_key" },
        { status: 400 },
      );
    }

    const matchEvent = await paymentService.matchPayment(ctx, id, body.invoiceId, body.idempotencyKey);
    return NextResponse.json(matchEvent, { status: 200 });
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
