import { NextRequest, NextResponse } from "next/server";
import { companyService } from "../../../lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await companyService.get();
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(profile, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const profile = await companyService.createOrUpdate(body);
    return NextResponse.json(profile, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
