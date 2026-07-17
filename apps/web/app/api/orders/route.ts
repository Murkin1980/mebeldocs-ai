import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../../../lib/services";

export const dynamic = "force-dynamic";

const DEFAULT_COMPANY_ID = "local-pilot";

export async function GET() {
  const orders = await orderService.list();
  return NextResponse.json(orders, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.counterpartyId || typeof body.counterpartyId !== "string") {
    return NextResponse.json({ error: "counterpartyId is required" }, { status: 400 });
  }
  if (!body.date || typeof body.date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: "at least one line is required" }, { status: 400 });
  }

  for (const line of body.lines) {
    if (!line.name || typeof line.name !== "string") {
      return NextResponse.json({ error: "each line must have a name" }, { status: 400 });
    }
    if (typeof line.quantityMilli !== "number" || line.quantityMilli <= 0) {
      return NextResponse.json({ error: "each line must have a positive quantityMilli" }, { status: 400 });
    }
    if (typeof line.unitPriceTiyn !== "number" || line.unitPriceTiyn < 0) {
      return NextResponse.json({ error: "each line must have a non-negative unitPriceTiyn" }, { status: 400 });
    }
  }

  try {
    const order = await orderService.create(DEFAULT_COMPANY_ID, {
      counterpartyId: body.counterpartyId,
      date: body.date,
      contractNumber: body.contractNumber,
      contractDate: body.contractDate,
      notes: body.notes,
      lines: body.lines,
    });
    return NextResponse.json(order, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
