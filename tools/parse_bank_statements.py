#!/usr/bin/env python3
"""Extract and deduplicate transactions from fixed-layout Kaspi PDF statement text."""

from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "working" / "bank"
TEXT = OUT / "text"
OWN_TIN = "910226302322"
LOCAL_DOCS = ROOT / "data" / "working" / "links" / "result.json"
START = re.compile(r"^\s*(\d+)\s+(\d{2}\.\d{2}\.\d{4})\s")


def amount(value: str) -> str:
    s = value.replace(" ", "").replace(",", ".").strip()
    if not s:
        return ""
    try:
        return str(Decimal(s).quantize(Decimal("0.01")))
    except InvalidOperation:
        return ""


def statement_pdfs() -> list[Path]:
    return sorted(p for p in RAW.rglob("*.pdf") if "выписк" in p.name.casefold())


def materialize_text(pdf: Path) -> Path:
    TEXT.mkdir(parents=True, exist_ok=True)
    target = TEXT / f"{pdf.stem}.txt"
    subprocess.run(["pdftotext", "-layout", str(pdf), str(target)], check=True)
    return target


def parse(text_path: Path, source_pdf: Path) -> list[dict]:
    lines = text_path.read_text(encoding="utf-8", errors="ignore").splitlines()
    blocks = []
    current = None
    for line in lines:
        m = START.match(line)
        if m:
            if current:
                blocks.append(current)
            debit = ""
            credit = ""
            amount_match = re.search(r"\d[\d ]*(?:,\d{1,2})?", line[m.end():64])
            if amount_match:
                absolute_start = m.end() + amount_match.start()
                parsed = amount(amount_match.group())
                if absolute_start < 44:
                    debit = parsed
                else:
                    credit = parsed
            current = {
                "source": str(source_pdf.relative_to(RAW)),
                "document_number": m.group(1),
                "date": m.group(2),
                "debit": debit,
                "credit": credit,
                "line": line,
                "continuation": [],
            }
        elif current:
            if line.strip():
                current["continuation"].append(line)
    if current:
        blocks.append(current)

    result = []
    for b in blocks:
        full = " ".join([b.pop("line"), *b.pop("continuation")])
        full = " ".join(full.split())
        iban_suffixes = {x[-12:] for x in re.findall(r"KZ[0-9A-Z]{18}", full, re.I)}
        tins = [x for x in re.findall(r"(?<!\d)\d{12}(?!\d)", full) if x != OWN_TIN and x not in iban_suffixes]
        refs = re.findall(r"(?:сч[её]т(?:у|а)?|сч)\s*№?\s*0*(\d+)", full, re.I)
        b.update({
            "counterparty_tins": sorted(set(tins)),
            "invoice_references": sorted(set(refs)),
            "purpose_text": full[:2000],
        })
        result.append(b)
    return result


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    all_records = []
    for pdf in statement_pdfs():
        all_records.extend(parse(materialize_text(pdf), pdf))

    unique = {}
    for r in all_records:
        key = "|".join([r["document_number"], r["date"], r["debit"], r["credit"], ",".join(r["counterparty_tins"])])
        if key in unique:
            unique[key]["sources"] = sorted(set(unique[key]["sources"] + [r["source"]]))
        else:
            unique[key] = {**r, "sources": [r["source"]]}
    records = list(unique.values())
    receipts = [r for r in records if r["credit"] and Decimal(r["credit"]) > 0]
    business_receipts = [r for r in receipts if r["counterparty_tins"] and not any(t in {"971240001315"} for t in r["counterparty_tins"])]
    payment_links = []
    if LOCAL_DOCS.exists():
        docs = json.loads(LOCAL_DOCS.read_text(encoding="utf-8"))["local_documents"]
        invoices = [d for d in docs if d["document_type"] == "invoice"]
        for receipt in business_receipts:
            if not receipt["invoice_references"]:
                continue
            pay_date = datetime.strptime(receipt["date"], "%d.%m.%Y")
            candidates = []
            for inv in invoices:
                if inv["number"] not in receipt["invoice_references"]:
                    continue
                if not set(inv["counterparty_tins"]).intersection(receipt["counterparty_tins"]):
                    continue
                score = 70
                evidence = ["invoice_reference", "counterparty_tin"]
                if inv["total"] == receipt["credit"]:
                    score += 20; evidence.append("full_amount")
                if inv["date"]:
                    try:
                        inv_date = datetime.strptime(inv["date"], "%d.%m.%Y")
                        if inv_date <= pay_date and (pay_date - inv_date).days <= 180:
                            score += 10; evidence.append("date_window")
                    except ValueError:
                        pass
                candidates.append({"invoice_source": inv["source"], "score": score, "evidence": evidence})
            if candidates:
                best = max(x["score"] for x in candidates)
                payment_links.append({
                    "payment_document_number": receipt["document_number"],
                    "payment_date": receipt["date"],
                    "amount": receipt["credit"],
                    "counterparty_tins": receipt["counterparty_tins"],
                    "invoice_references": receipt["invoice_references"],
                    "best_score": best,
                    "candidates": [x for x in candidates if x["score"] == best],
                })
    (OUT / "transactions.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "business_receipts.json").write_text(json.dumps(business_receipts, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "proposed_payment_links.json").write_text(json.dumps(payment_links, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {
        "statement_files": len(statement_pdfs()),
        "raw_transaction_occurrences": len(all_records),
        "unique_transactions": len(records),
        "credit_transactions": len(receipts),
        "business_receipts_with_tin": len(business_receipts),
        "business_receipts_with_invoice_reference": sum(bool(r["invoice_references"]) for r in business_receipts),
        "payments_with_proposed_invoice_link": len(payment_links),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
