import { NextRequest, NextResponse } from "next/server";
import { invoiceService, pdfStorage } from "../../../../../lib/services";
import { generateInvoicePdf } from "../../../../../lib/pdf-generator";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  const { id } = await context.params;

  const existing = await pdfStorage.getPdf(id);
  if (existing) {
    return new NextResponse(existing, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const invoice = await invoiceService.get(id);
  if (!invoice) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const pdfBuffer = await generateInvoicePdf(invoice);
    await pdfStorage.savePdf(id, pdfBuffer);
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
