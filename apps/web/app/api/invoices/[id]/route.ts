import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "../../../../lib/services";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  const { id } = await context.params;
  const invoice = await invoiceService.get(id);
  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(invoice, { headers: { "Cache-Control": "no-store" } });
}
