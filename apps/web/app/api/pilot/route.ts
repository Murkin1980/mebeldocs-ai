import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { demoSnapshot, toPublicSnapshot } from "../../../lib/pilot";

type RawManifest = {
  generated_at?: string;
  counts?: Record<string, number>;
};

type RawReview = { document_version_clusters?: number };

export const dynamic = "force-dynamic";

async function readJson<T>(name: string): Promise<T> {
  const projectRoot = path.resolve(process.cwd(), "../..");
  const file = path.join(projectRoot, "data", "working", "pilot_snapshot", name);
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function GET() {
  try {
    const [manifest, review] = await Promise.all([
      readJson<RawManifest>("manifest.json"),
      readJson<RawReview>("review_queue.json"),
    ]);
    const c = manifest.counts ?? {};
    const payload = toPublicSnapshot({
      counterparties: c.counterparties ?? 0,
      nomenclatureCandidates: c.nomenclature_candidates ?? 0,
      activeOutgoingEsf: c.active_outgoing_esf ?? 0,
      documentVersionClusters: c.document_version_clusters ?? 0,
      documentToEsfProposals: c.document_to_esf_proposals ?? 0,
      paymentToInvoiceProposals: c.payment_to_invoice_proposals ?? 0,
    }, {
      sourceMode: "pilot",
      generatedAt: manifest.generated_at ?? null,
      versionReviews: review.document_version_clusters ?? 0,
    });
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(demoSnapshot, { headers: { "Cache-Control": "no-store", "X-MebelDocs-Source": "demo-fallback" } });
  }
}
