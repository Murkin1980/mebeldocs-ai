import assert from "node:assert/strict";
import test from "node:test";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { generateInvoicePdf } from "../lib/pdf-generator.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const invoice = {
  sellerSnapshot: {
    legalName: "TOO Grand Mebel Pro",
    binIin: "123456789012",
    address: "Almaty, Tulebayeva 45, office 301",
    phone: "+7 (727) 555-12-34",
    email: "info@grandmebel.kz",
    iban: "KZ12345678901234567890",
    bankName: "BCS Bank",
    bik: "123456789",
  },
  buyerSnapshot: {
    name: "IP Mebelny Master",
    binIin: "987654321098",
    address: "Astana, prospect Mangilik El 62",
  },
  number: "INV-2026-001",
  date: "18.07.2026",
  status: "confirmed" as const,
  contractNumber: "DM-2026/042",
  contractDate: "01.07.2026",
  linesSnapshot: [
    {
      name: "Kitchen set Duboviy with oak facades",
      quantityMilli: 2000,
      unit: "pcs",
      unitPriceTiyn: 50000000,
      lineTotalTiyn: 100000000,
    },
    {
      name: "Dining table Family 180x90cm",
      quantityMilli: 1000,
      unit: "pcs",
      unitPriceTiyn: 35000000,
      lineTotalTiyn: 35000000,
    },
    {
      name: "Office chair ergonomic with armrests",
      quantityMilli: 4000,
      unit: "pcs",
      unitPriceTiyn: 8000000,
      lineTotalTiyn: 32000000,
    },
    {
      name: "Wardrobe 3-door 240x60x220cm mirror",
      quantityMilli: 1000,
      unit: "pcs",
      unitPriceTiyn: 80000000,
      lineTotalTiyn: 80000000,
    },
    {
      name: "Computer desk with keyboard tray",
      quantityMilli: 2000,
      unit: "pcs",
      unitPriceTiyn: 12000000,
      lineTotalTiyn: 24000000,
    },
  ],
  subtotalTiyn: 271000000,
  discountTiyn: 0,
  totalTiyn: 271000000,
};

test("PDF generation produces valid PDF bytes", async () => {
  const pdf = await generateInvoicePdf(invoice as any);

  assert.ok(Buffer.isBuffer(pdf), "Result must be a Buffer");

  const header = pdf.subarray(0, 5).toString("ascii");
  assert.equal(header, "%PDF-", "First 5 bytes must be PDF magic '%PDF-'");

  assert.ok(pdf.length > 1000, `PDF length ${pdf.length} must exceed 1000 bytes`);
});

test("PDF has correct structure for 5-line invoice", async () => {
  const pdf = await generateInvoicePdf(invoice as any);

  assert.ok(pdf.length > 0, "PDF must not be empty");
  const str = pdf.toString("latin1");
  assert.ok(str.includes("%PDF-"), "PDF must start with %PDF header");
  assert.ok(str.includes("obj"), "PDF must contain PDF objects");
  assert.ok(str.includes("stream"), "PDF must contain compressed streams");
});

test("Save PDF to docs/screens for visual verification", async () => {
  const pdf = await generateInvoicePdf(invoice as any);

  const outDir = join(__dirname, "..", "docs", "screens");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const outPath = join(outDir, "invoice-test.pdf");
  writeFileSync(outPath, pdf);

  assert.ok(existsSync(outPath), `PDF file must exist at ${outPath}`);
  assert.ok(pdf.length > 1000, "Saved PDF must be substantial");
});
