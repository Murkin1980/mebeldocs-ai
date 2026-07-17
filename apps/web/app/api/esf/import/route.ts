import { NextRequest, NextResponse } from "next/server";
import { esfReviewService } from "../../../../lib/services";
import {
  getServerContext,
  requireWriteAccess,
  AuthError,
} from "../../../../lib/auth/server-context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ctx = getServerContext();
    requireWriteAccess(ctx);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "invalid_body", code: "invalid_body" },
        { status: 400 },
      );
    }

    if (!body.xml || typeof body.xml !== "string") {
      return NextResponse.json(
        { error: "xml is required", code: "missing_xml" },
        { status: 400 },
      );
    }

    if (!body.filename || typeof body.filename !== "string") {
      return NextResponse.json(
        { error: "filename is required", code: "missing_filename" },
        { status: 400 },
      );
    }

    const review = await esfReviewService.importXml(ctx, body.xml, body.filename);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "forbidden" ? 403 : 401 },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message, code: "internal_error" },
      { status: 400 },
    );
  }
}
