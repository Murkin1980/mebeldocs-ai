#!/usr/bin/env python3
"""Build a deterministic inventory of pilot source files without modifying them."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "working" / "inventory"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def normalize_name(name: str) -> str:
    stem = Path(name).stem.casefold()
    stem = re.sub(r"~\$|копия|copy|исправлено|без печати|с печатью", " ", stem)
    stem = re.sub(r"\(\d+\)|_\d+$", " ", stem)
    stem = re.sub(r"[^0-9a-zа-яё]+", " ", stem)
    return " ".join(stem.split())


def classify(path: Path) -> str:
    s = str(path).casefold()
    n = path.name.casefold()
    if n.startswith("~$"):
        return "temporary"
    if "счет на оплат" in s or "счёт на оплат" in s:
        return "invoice"
    if "накладн" in s or n.startswith("продажа"):
        return "goods_issue"
    if "авр" in s or "акт выполн" in s:
        return "service_act"
    if "эсф" in s or "esf" in s:
        return "esf"
    if "договор" in s:
        return "contract"
    if "реквизит" in s:
        return "requisites"
    if "выписка" in s or "поступлен" in s:
        return "bank_or_receipts"
    if "печать" in s or "подпись" in s:
        return "signature_asset"
    if "приходн" in s:
        return "cash_receipt"
    return "other"


def office_text_fingerprint(path: Path) -> str | None:
    if path.suffix.casefold() not in {".xlsx", ".xlsm", ".docx"}:
        return None
    try:
        with zipfile.ZipFile(path) as z:
            parts = []
            for name in sorted(z.namelist()):
                if name.endswith(".xml") and ("worksheets/" in name or name.endswith("sharedStrings.xml") or "word/document.xml" in name):
                    text = z.read(name).decode("utf-8", "ignore")
                    text = re.sub(r"<[^>]+>", " ", text)
                    parts.append(" ".join(text.casefold().split()))
            if not parts:
                return None
            return hashlib.sha256("\n".join(parts).encode()).hexdigest()
    except (OSError, zipfile.BadZipFile):
        return None


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for path in sorted(p for p in RAW.rglob("*") if p.is_file() and p.name != "README.md"):
        rel = path.relative_to(RAW)
        st = path.stat()
        rows.append({
            "relative_path": str(rel),
            "filename": path.name,
            "extension": path.suffix.casefold(),
            "size_bytes": st.st_size,
            "modified_utc": datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat(),
            "sha256": sha256(path),
            "content_fingerprint": office_text_fingerprint(path) or "",
            "normalized_name": normalize_name(path.name),
            "document_class": classify(rel),
        })

    exact = defaultdict(list)
    content = defaultdict(list)
    names = defaultdict(list)
    for row in rows:
        exact[row["sha256"]].append(row["relative_path"])
        if row["content_fingerprint"]:
            content[row["content_fingerprint"]].append(row["relative_path"])
        names[row["normalized_name"]].append(row["relative_path"])

    duplicates = {
        "exact": {k: v for k, v in exact.items() if len(v) > 1},
        "same_office_content": {k: v for k, v in content.items() if len(v) > 1},
        "same_normalized_name": {k: v for k, v in names.items() if len(v) > 1 and k},
    }
    with (OUT / "files.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    (OUT / "duplicates.json").write_text(json.dumps(duplicates, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "file_count": len(rows),
        "total_bytes": sum(r["size_bytes"] for r in rows),
        "by_extension": Counter(r["extension"] or "[none]" for r in rows),
        "by_document_class": Counter(r["document_class"] for r in rows),
        "exact_duplicate_groups": len(duplicates["exact"]),
        "same_office_content_groups": len(duplicates["same_office_content"]),
        "same_normalized_name_groups": len(duplicates["same_normalized_name"]),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
