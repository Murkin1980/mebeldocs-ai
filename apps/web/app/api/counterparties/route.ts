import { NextRequest, NextResponse } from "next/server";
import { counterpartyService } from "../../../lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await counterpartyService.list();
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  try {
    const counterparty = await counterpartyService.create({
      name: body.name.trim(),
      binIin: typeof body.binIin === "string" ? body.binIin : undefined,
      address: typeof body.address === "string" ? body.address : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
    });
    return NextResponse.json(counterparty, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
