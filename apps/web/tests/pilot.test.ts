import assert from "node:assert/strict";
import test from "node:test";
import { toPublicSnapshot } from "../lib/pilot.ts";

test("public snapshot exposes aggregates and review tasks", () => {
  const result = toPublicSnapshot({
    counterparties: 2,
    nomenclatureCandidates: 3,
    activeOutgoingEsf: 4,
    documentVersionClusters: 5,
    documentToEsfProposals: 6,
    paymentToInvoiceProposals: 7,
  }, { sourceMode: "pilot", versionReviews: 8 });
  assert.equal(result.summary.ready, 5);
  assert.equal(result.summary.review, 8);
  assert.equal(result.reviewTasks.length, 4);
});

test("public contract contains no sensitive accounting fields", () => {
  const json = JSON.stringify(toPublicSnapshot({
    counterparties: 1,
    nomenclatureCandidates: 1,
    activeOutgoingEsf: 1,
    documentVersionClusters: 1,
    documentToEsfProposals: 1,
    paymentToInvoiceProposals: 1,
  }));
  for (const forbidden of ["tin", "iin", "iban", "bank_account", "registration_number", "products", "sources"]) {
    assert.equal(json.toLowerCase().includes(forbidden), false, forbidden);
  }
});
