export const decisionActions = ["merge_versions", "keep_separate", "defer"] as const;
export type DecisionAction = (typeof decisionActions)[number];
export type DecisionEvent = { eventId: string; reviewId: string; action: DecisionAction; actor: "local_owner"; occurredAt: string; idempotencyKey: string; previousAction: DecisionAction | null };
export type ReviewDecision = { reviewId: string; action: DecisionAction; eventId: string; decidedAt: string };

export function isDecisionAction(value: unknown): value is DecisionAction {
  return typeof value === "string" && decisionActions.includes(value as DecisionAction);
}
export function isSafeReviewId(value: string): boolean { return /^[a-z0-9][a-z0-9-]{0,63}$/.test(value); }
export function latestDecisions(events: DecisionEvent[]): Map<string, ReviewDecision> {
  const result = new Map<string, ReviewDecision>();
  for (const event of [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) {
    result.set(event.reviewId, { reviewId: event.reviewId, action: event.action, eventId: event.eventId, decidedAt: event.occurredAt });
  }
  return result;
}
