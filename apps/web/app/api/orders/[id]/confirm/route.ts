import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../../../../../lib/services";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const order = await orderService.confirm(id);
    return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
