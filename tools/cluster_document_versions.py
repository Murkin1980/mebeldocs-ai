#!/usr/bin/env python3
"""Group physical files into reviewable document-version clusters."""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INV = ROOT / "data" / "working" / "inventory"
OUT = ROOT / "data" / "working" / "version_clusters"


class DSU:
    def __init__(self, items):
        self.parent = {x: x for x in items}

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a != b:
            self.parent[b] = a


def generic_name(value: str) -> bool:
    tokens = value.split()
    return len(tokens) < 3 or value.startswith(("debt", "invoiceprintreport", "export esf", "шаблон"))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with (INV / "files.csv").open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    by_path = {r["relative_path"]: r for r in rows}
    dsu = DSU(by_path)
    reasons = defaultdict(set)

    def connect(paths, reason):
        paths = list(paths)
        for p in paths[1:]:
            dsu.union(paths[0], p)
        for a in paths:
            reasons[a].add(reason)

    for field, reason in [("sha256", "exact_binary"), ("content_fingerprint", "same_office_content")]:
        groups = defaultdict(list)
        for r in rows:
            if r[field]: groups[r[field]].append(r["relative_path"])
        for paths in groups.values():
            if len(paths) > 1: connect(paths, reason)

    names = defaultdict(list)
    for r in rows:
        if r["normalized_name"] and not generic_name(r["normalized_name"]):
            names[(r["document_class"], r["normalized_name"])].append(r["relative_path"])
    for paths in names.values():
        if len(paths) > 1: connect(paths, "same_normalized_name_and_class")

    clusters = defaultdict(list)
    for path in by_path:
        clusters[dsu.find(path)].append(path)
    output = []
    for paths in clusters.values():
        if len(paths) < 2:
            continue
        # Office lock files are implementation debris, not document versions.
        if all(by_path[p]["document_class"] == "temporary" for p in paths):
            continue
        cluster_reasons = sorted(set().union(*(reasons[p] for p in paths)))
        confidence = "high" if "exact_binary" in cluster_reasons or "same_office_content" in cluster_reasons else "review"
        classes = sorted(set(by_path[p]["document_class"] for p in paths))
        output.append({
            "cluster_id": f"cluster-{len(output)+1:03d}",
            "confidence": confidence,
            "reasons": cluster_reasons,
            "document_classes": classes,
            "files": sorted(paths),
        })
    (OUT / "clusters.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {
        "clusters": len(output),
        "files_in_clusters": sum(len(x["files"]) for x in output),
        "high_confidence_clusters": sum(x["confidence"] == "high" for x in output),
        "review_clusters": sum(x["confidence"] == "review" for x in output),
        "by_class": Counter(c for x in output for c in x["document_classes"]),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
