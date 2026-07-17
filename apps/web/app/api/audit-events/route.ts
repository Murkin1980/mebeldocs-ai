import { NextResponse } from "next/server";
import { auditRepo } from "../../../lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await auditRepo.list();
  return NextResponse.json(events, { headers: { "Cache-Control": "no-store" } });
}
