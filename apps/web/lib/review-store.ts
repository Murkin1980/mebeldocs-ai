import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type DecisionAction, type DecisionEvent, latestDecisions } from "./review-decisions.ts";

function eventsDir(): string { return path.resolve(process.cwd(), "../..", "data", "working", "audit", "review-events"); }
function keyFile(key: string): string { return path.join(eventsDir(), `${createHash("sha256").update(key).digest("hex")}.json`); }

export async function listEvents(): Promise<DecisionEvent[]> {
  const directory = eventsDir(); await mkdir(directory, { recursive: true });
  const events: DecisionEvent[] = [];
  for (const file of (await readdir(directory)).filter((name) => name.endsWith(".json")).sort()) {
    try { events.push(JSON.parse(await readFile(path.join(directory, file), "utf8")) as DecisionEvent); }
    catch { /* Damaged events remain on disk for forensic review and are not trusted by the UI. */ }
  }
  return events;
}
export async function getDecision(reviewId: string) { return latestDecisions(await listEvents()).get(reviewId) ?? null; }
export async function recordDecision(input: { reviewId: string; action: DecisionAction; idempotencyKey: string }) {
  const target = keyFile(input.idempotencyKey); await mkdir(eventsDir(), { recursive: true });
  try { return { event: JSON.parse(await readFile(target, "utf8")) as DecisionEvent, repeated: true }; } catch { /* create below */ }
  const previous = await getDecision(input.reviewId);
  const event: DecisionEvent = { eventId: randomUUID(), reviewId: input.reviewId, action: input.action, actor: "local_owner", occurredAt: new Date().toISOString(), idempotencyKey: input.idempotencyKey, previousAction: previous?.action ?? null };
  try {
    await writeFile(target, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return { event, repeated: false };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    return { event: JSON.parse(await readFile(target, "utf8")) as DecisionEvent, repeated: true };
  }
}
