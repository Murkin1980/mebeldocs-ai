import { NextRequest, NextResponse } from "next/server";
import { esfReviewService } from "../../../../lib/services";
import {
  getServerContext,
  AuthError,
} from "../../../../lib/auth/server-context";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const ctx = getServerContext();
    const review = await esfReviewService.getReview(ctx, id);
    return NextResponse.json(review, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "forbidden" ? 403 : 401 },
      );
    }
    const message = (error as Error).message;
    if (message === "not_found" || message === "esf_review_not_found") {
      return NextResponse.json(
        { error: "not_found", code: "not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: message, code: "internal_error" },
      { status: 500 },
    );
  }
}
