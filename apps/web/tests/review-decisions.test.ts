import assert from "node:assert/strict";
import test from "node:test";
import { isDecisionAction, isSafeReviewId, latestDecisions, type DecisionEvent } from "../lib/review-decisions.ts";
import { recordDecision } from "../lib/review-store.ts";

test("validates decision vocabulary and review ids", () => {
  assert.equal(isDecisionAction("merge_versions"), true); assert.equal(isDecisionAction("delete_original"), false);
  assert.equal(isSafeReviewId("version-cluster-003"), true); assert.equal(isSafeReviewId("../../secret"), false);
});
test("later decisions become current without deleting history", () => {
  const events: DecisionEvent[] = [
    { eventId: "1", reviewId: "version-cluster-003", action: "defer", actor: "local_owner", occurredAt: "2026-01-01T00:00:00Z", idempotencyKey: "first-key", previousAction: null },
    { eventId: "2", reviewId: "version-cluster-003", action: "merge_versions", actor: "local_owner", occurredAt: "2026-01-02T00:00:00Z", idempotencyKey: "second-key", previousAction: "defer" },
  ];
  assert.equal(events.length, 2); assert.equal(latestDecisions(events).get("version-cluster-003")?.action, "merge_versions");
});
test("repeating an idempotency key returns the original event", async () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  const first = await recordDecision({ reviewId: "test-review", action: "defer", idempotencyKey: key });
  const second = await recordDecision({ reviewId: "test-review", action: "merge_versions", idempotencyKey: key });
  assert.equal(first.event.eventId, second.event.eventId);
  assert.equal(second.event.action, "defer");
  assert.equal(second.repeated, true);
});
