import { NextRequest, NextResponse } from "next/server";
import { esfReviewService } from "../../../../../lib/services";
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
    const baselineData = body && typeof body === "object" && body.baselineData
      ? body.baselineData
      : undefined;

    const review = await esfReviewService.confirmBaseline(ctx, id, baselineData);
    return NextResponse.json(review, { status: 200 });
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
