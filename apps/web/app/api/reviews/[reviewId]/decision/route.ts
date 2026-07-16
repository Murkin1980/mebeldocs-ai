import { NextRequest, NextResponse } from "next/server";
import { isDecisionAction, isSafeReviewId } from "../../../../../lib/review-decisions";
import { getDecision, recordDecision } from "../../../../../lib/review-store";

type Context = { params: Promise<{ reviewId: string }> };
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: Context) {
  const { reviewId } = await context.params;
  if (!isSafeReviewId(reviewId)) return NextResponse.json({ error: "invalid_review_id" }, { status: 400 });
  return NextResponse.json({ decision: await getDecision(reviewId) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest, context: Context) {
  const { reviewId } = await context.params;
  if (!isSafeReviewId(reviewId)) return NextResponse.json({ error: "invalid_review_id" }, { status: 400 });
  const body = await request.json().catch(() => null) as { action?: unknown; idempotencyKey?: unknown } | null;
  if (!body || !isDecisionAction(body.action)) return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  if (typeof body.idempotencyKey !== "string" || body.idempotencyKey.length < 8 || body.idempotencyKey.length > 128) return NextResponse.json({ error: "invalid_idempotency_key" }, { status: 400 });
  const result = await recordDecision({ reviewId, action: body.action, idempotencyKey: body.idempotencyKey });
  return NextResponse.json(result, { status: result.repeated ? 200 : 201, headers: { "Cache-Control": "no-store" } });
}
