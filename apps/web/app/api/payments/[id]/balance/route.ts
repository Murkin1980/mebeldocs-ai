import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "../../../../../lib/services";
import {
  getServerContext,
  AuthError,
} from "../../../../../lib/auth/server-context";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const ctx = getServerContext();

    const payment = await paymentService.getPayment(ctx, id);
    if (!payment.invoiceId) {
      return NextResponse.json(
        { error: "payment has no linked invoice", code: "no_invoice_linked" },
        { status: 400 },
      );
    }

    const balance = await paymentService.getInvoiceBalance(ctx, payment.invoiceId);
    return NextResponse.json(balance, { headers: { "Cache-Control": "no-store" } });
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
