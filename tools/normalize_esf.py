#!/usr/bin/env python3
"""Normalize ESF exports, preserve lifecycle statuses, and flag duplicate business events."""

from __future__ import annotations

import csv
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "working" / "esf"
OWN_TIN = "910226302322"
INACTIVE = {"CANCELED", "REVOKED", "DECLINED"}


def tag(el: ET.Element) -> str:
    return el.tag.split("}")[-1]


def strip_ns(root: ET.Element) -> None:
    for el in root.iter():
        el.tag = tag(el)


def text(root: ET.Element, path: str) -> str:
    el = root.find(path)
    return " ".join((el.text or "").split()) if el is not None else ""


def money(value: str) -> str:
    try:
        return str(Decimal(value).quantize(Decimal("0.01")))
    except (InvalidOperation, ValueError):
        return ""


def parse_invoice_info(info: ET.Element, source: Path) -> dict:
    meta = {tag(ch): " ".join((ch.text or "").split()) for ch in info if tag(ch) != "invoiceBody"}
    body = next((ch for ch in info if tag(ch) == "invoiceBody"), None)
    if body is None or not body.text:
        raise ValueError("invoiceBody missing")
    inv = ET.fromstring(body.text.lstrip("\ufeff").strip())
    strip_ns(inv)
    seller_tin = text(inv, "./sellers/seller/tin")
    buyer_tin = text(inv, "./customers/customer/tin")
    status = meta.get("invoiceStatus", "")
    direction = "outgoing" if seller_tin == OWN_TIN else "incoming" if buyer_tin == OWN_TIN else "external"
    products = []
    for product in inv.findall("./productSet/products/product"):
        products.append({
            "description": text(product, "description"),
            "quantity": text(product, "quantity"),
            "unit_price": text(product, "unitPrice"),
            "price_with_tax": text(product, "priceWithTax"),
        })
    return {
        "source": str(source.relative_to(RAW)),
        "invoice_id": meta.get("invoiceId", ""),
        "registration_number": meta.get("registrationNumber", ""),
        "status": status,
        "active": status not in INACTIVE,
        "cancel_reason": meta.get("cancelReason", ""),
        "input_date": meta.get("inputDate", ""),
        "last_update_date": meta.get("lastUpdateDate", ""),
        "direction": direction,
        "number": text(inv, "num"),
        "issue_date": text(inv, "date"),
        "turnover_date": text(inv, "turnoverDate"),
        "seller_tin": seller_tin,
        "seller_name": text(inv, "./sellers/seller/name"),
        "buyer_tin": buyer_tin,
        "buyer_name": text(inv, "./customers/customer/name"),
        "total": money(text(inv, "./productSet/totalPriceWithTax")),
        "contract_number": text(inv, "./deliveryTerm/contractNum"),
        "contract_date": text(inv, "./deliveryTerm/contractDate"),
        "products": products,
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    for source in sorted(RAW.glob("export_esf*.xml")):
        root = ET.parse(source).getroot()
        for info in (el for el in root.iter() if tag(el) == "invoiceInfo"):
            records.append(parse_invoice_info(info, source))

    active = [r for r in records if r["active"]]
    business_groups = defaultdict(list)
    for r in active:
        counterparty = r["buyer_tin"] if r["direction"] == "outgoing" else r["seller_tin"]
        key = "|".join([r["direction"], counterparty, r["turnover_date"], r["total"]])
        business_groups[key].append(r["registration_number"])
    possible_duplicates = {k: v for k, v in business_groups.items() if len(v) > 1}

    (OUT / "records.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "possible_active_duplicates.json").write_text(json.dumps(possible_duplicates, ensure_ascii=False, indent=2), encoding="utf-8")
    fields = [k for k in records[0] if k != "products"]
    with (OUT / "records.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows({k: r[k] for k in fields} for r in records)
    summary = {
        "records": len(records),
        "active": len(active),
        "inactive": len(records) - len(active),
        "by_status": Counter(r["status"] for r in records),
        "by_direction": Counter(r["direction"] for r in records),
        "possible_active_duplicate_groups": len(possible_duplicates),
    }
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
