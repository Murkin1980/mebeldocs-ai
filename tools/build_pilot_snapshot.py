#!/usr/bin/env python3
"""Build a local, review-first pilot snapshot from normalized extraction results."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "data" / "working"
OUT = WORK / "pilot_snapshot"


def load(relative: str):
    return json.loads((WORK / relative).read_text(encoding="utf-8"))


def write(name: str, value) -> None:
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    esf = load("esf/records.json")
    counterparties = load("entities/counterparties.json")
    nomenclature = load("entities/nomenclature_candidates.json")
    clusters = load("version_clusters/clusters.json")
    doc_links = load("links/result.json")
    payment_links = load("bank/proposed_payment_links.json")

    own = next((x for x in esf if x.get("direction") == "outgoing"), None)
    company = {
        "tin": own.get("seller_tin", "") if own else "",
        "name": own.get("seller_name", "") if own else "",
        "status": "candidate_requires_owner_confirmation",
        "source": own.get("source", "") if own else "",
    }
    active_outgoing = [x for x in esf if x.get("direction") == "outgoing" and x.get("active")]
    review_queue = {
        "company_profile": 1 if company["tin"] else 0,
        "document_version_clusters": sum(x["confidence"] == "review" for x in clusters),
        "document_to_esf_proposals": len(doc_links.get("proposed_links", [])),
        "payment_to_invoice_proposals": len(payment_links),
        "principle": "No proposal becomes accounting truth without user confirmation.",
    }
    manifest = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_mode": "local_archive_read_only",
        "counts": {
            "counterparties": len(counterparties),
            "nomenclature_candidates": len(nomenclature),
            "active_outgoing_esf": len(active_outgoing),
            "document_version_clusters": len(clusters),
            "document_to_esf_proposals": len(doc_links.get("proposed_links", [])),
            "payment_to_invoice_proposals": len(payment_links),
        },
        "files": [
            "company_candidate.json", "counterparties.json", "nomenclature_candidates.json",
            "active_outgoing_esf.json", "document_version_clusters.json",
            "document_to_esf_proposals.json", "payment_to_invoice_proposals.json",
            "review_queue.json",
        ],
    }
    write("company_candidate.json", company)
    write("counterparties.json", counterparties)
    write("nomenclature_candidates.json", nomenclature)
    write("active_outgoing_esf.json", active_outgoing)
    write("document_version_clusters.json", clusters)
    write("document_to_esf_proposals.json", doc_links.get("proposed_links", []))
    write("payment_to_invoice_proposals.json", payment_links)
    write("review_queue.json", review_queue)
    write("manifest.json", manifest)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
