import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Invoice } from "./domain/entities";
import { formatMoney } from "./domain/money";

const FONT_SIZE = 10;
const HEADER_SIZE = 14;
const SMALL_SIZE = 8;
const LINE_HEIGHT = 14;
const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89; // A4

function formatMoneyPdf(tiyn: number): string {
  const tenge = tiyn / 100;
  return `${tenge.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KZT`;
}

export async function generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  const doc = await PDFDocument.create();
  // TODO: embed DejaVu Sans or Noto Sans for full Cyrillic support
  // StandardFonts Helvetica renders only Latin glyphs; Cyrillic appears as missing glyphs
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let y = PAGE_HEIGHT - MARGIN;

  // Header
  page.drawText("INVOICE", {
    x: MARGIN,
    y,
    size: HEADER_SIZE,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT * 2;

  // Invoice number and date
  page.drawText(`No: ${invoice.number}`, {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font,
  });
  page.drawText(`Date: ${invoice.date}`, {
    x: PAGE_WIDTH / 2,
    y,
    size: FONT_SIZE,
    font,
  });
  y -= LINE_HEIGHT * 2;

  // Status
  const statusText = invoice.status === "confirmed" ? "CONFIRMED" : "DRAFT";
  page.drawText(`Status: ${statusText}`, {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font: fontBold,
    color: invoice.status === "confirmed" ? rgb(0, 0.5, 0) : rgb(0.5, 0, 0),
  });
  y -= LINE_HEIGHT * 2;

  // Seller
  page.drawText("Seller:", {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font: fontBold,
  });
  y -= LINE_HEIGHT;
  const seller = invoice.sellerSnapshot;
  page.drawText(seller.legalName || "-", { x: MARGIN + 10, y, size: FONT_SIZE, font });
  y -= LINE_HEIGHT;
  if (seller.binIin) {
    page.drawText(`BIN/IIN: ${seller.binIin}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  if (seller.address) {
    page.drawText(`Address: ${seller.address}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  if (seller.iban) {
    page.drawText(`IIK: ${seller.iban}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  if (seller.bankName) {
    page.drawText(`Bank: ${seller.bankName}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  if (seller.bik) {
    page.drawText(`BIC: ${seller.bik}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  y -= LINE_HEIGHT;

  // Buyer
  page.drawText("Buyer:", {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font: fontBold,
  });
  y -= LINE_HEIGHT;
  const buyer = invoice.buyerSnapshot;
  page.drawText(buyer.name || "-", { x: MARGIN + 10, y, size: FONT_SIZE, font });
  y -= LINE_HEIGHT;
  if (buyer.binIin) {
    page.drawText(`BIN/IIN: ${buyer.binIin}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  if (buyer.address) {
    page.drawText(`Address: ${buyer.address}`, { x: MARGIN + 10, y, size: SMALL_SIZE, font });
    y -= LINE_HEIGHT;
  }
  y -= LINE_HEIGHT;

  // Contract
  const contract = invoice.contractNumber
    ? `Contract: No${invoice.contractNumber} / ${invoice.contractDate ?? invoice.date}`
    : `Contract: Without number / ${invoice.date}`;
  page.drawText(contract, { x: MARGIN, y, size: FONT_SIZE, font });
  y -= LINE_HEIGHT * 2;

  // Table header
  page.drawRectangle({
    x: MARGIN,
    y: y - 2,
    width: PAGE_WIDTH - MARGIN * 2,
    height: LINE_HEIGHT + 4,
    color: rgb(0.9, 0.95, 0.9),
  });
  page.drawText("#", { x: MARGIN + 4, y, size: SMALL_SIZE, font: fontBold });
  page.drawText("Description", { x: MARGIN + 30, y, size: SMALL_SIZE, font: fontBold });
  page.drawText("Qty", { x: MARGIN + 280, y, size: SMALL_SIZE, font: fontBold });
  page.drawText("Unit", { x: MARGIN + 330, y, size: SMALL_SIZE, font: fontBold });
  page.drawText("Price", { x: MARGIN + 365, y, size: SMALL_SIZE, font: fontBold });
  page.drawText("Total", { x: MARGIN + 440, y, size: SMALL_SIZE, font: fontBold });
  y -= LINE_HEIGHT + 6;

  // Table rows
  for (let i = 0; i < invoice.linesSnapshot.length; i++) {
    const line = invoice.linesSnapshot[i];
    if (y < MARGIN + 100) {
      const newPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(`${i + 1}`, { x: MARGIN + 4, y, size: FONT_SIZE, font });
    page.drawText(line.name.substring(0, 40), { x: MARGIN + 30, y, size: FONT_SIZE, font });
    const qty = line.quantityMilli / 1000;
    page.drawText(`${qty}`, { x: MARGIN + 280, y, size: FONT_SIZE, font });
    page.drawText(line.unit, { x: MARGIN + 330, y, size: FONT_SIZE, font });
    page.drawText(formatMoneyPdf(line.unitPriceTiyn), { x: MARGIN + 365, y, size: FONT_SIZE, font });
    page.drawText(formatMoneyPdf(line.lineTotalTiyn), { x: MARGIN + 440, y, size: FONT_SIZE, font });
    y -= LINE_HEIGHT;

    // Line separator
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 4;
  }

  y -= LINE_HEIGHT;

  // Totals
  page.drawText("Total:", { x: MARGIN + 280, y, size: FONT_SIZE, font: fontBold });
  page.drawText(formatMoneyPdf(invoice.subtotalTiyn), { x: MARGIN + 365, y, size: FONT_SIZE, font: fontBold });
  page.drawText(formatMoneyPdf(invoice.totalTiyn), { x: MARGIN + 440, y, size: FONT_SIZE, font: fontBold });
  y -= LINE_HEIGHT;

  if (invoice.discountTiyn > 0) {
    page.drawText("Discount:", { x: MARGIN + 280, y, size: FONT_SIZE, font });
    page.drawText(`-${formatMoneyPdf(invoice.discountTiyn)}`, { x: MARGIN + 440, y, size: FONT_SIZE, font });
    y -= LINE_HEIGHT;
  }

  y -= LINE_HEIGHT * 2;

  // Footer
  page.drawText("Payment of this invoice implies acceptance of delivery terms.", {
    x: MARGIN,
    y,
    size: SMALL_SIZE,
    font,
  });
  y -= LINE_HEIGHT * 2;

  page.drawText("Director: _________________________", {
    x: MARGIN,
    y,
    size: SMALL_SIZE,
    font,
  });

  page.drawText("Accountant: _________________________", {
    x: PAGE_WIDTH / 2,
    y,
    size: SMALL_SIZE,
    font,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
