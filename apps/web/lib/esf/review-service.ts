import { randomUUID } from "node:crypto";
import type { EsfReview, EsfExtractedData, AuditEvent } from "../domain/entities";
import type { EsfReviewRepository, AuditEventRepository } from "../domain/repository";
import type { ServerContext } from "../auth/server-context";
import { parseEsfXml } from "./xml-parser";
import { compareEsfData, calculateVerificationResult } from "./comparison";

export class EsfReviewService {
  constructor(
    private reviewRepo: EsfReviewRepository,
    private auditRepo: AuditEventRepository,
  ) {}

  async importXml(
    ctx: ServerContext,
    xmlString: string,
    filename: string,
  ): Promise<EsfReview> {
    const esfData = parseEsfXml(xmlString);

    const review: EsfReview = {
      id: randomUUID(),
      companyId: ctx.user.companyId,
      status: "imported",
      importedXmlFilename: filename,
      importedAt: new Date().toISOString(),
      importedBy: ctx.user.userId,
      importedEsfData: esfData,
    };

    await this.reviewRepo.create(review);
    await this.recordAudit(ctx, review, "esf_imported");
    return review;
  }

  async confirmBaseline(
    ctx: ServerContext,
    reviewId: string,
    baselineData?: EsfExtractedData,
  ): Promise<EsfReview> {
    const review = await this.getReview(ctx, reviewId);
    if (review.status !== "imported") {
      throw new Error("baseline_only_from_imported");
    }

    const baseline = baselineData ?? review.importedEsfData;
    const updated = await this.reviewRepo.update(reviewId, {
      status: "baseline_confirmed",
      baseline,
      baselineConfirmedAt: new Date().toISOString(),
      baselineConfirmedBy: ctx.user.userId,
    });

    await this.recordAudit(ctx, updated, "esf_baseline_confirmed");
    return updated;
  }

  async finalCheck(
    ctx: ServerContext,
    reviewId: string,
    finalXmlString: string,
    filename: string,
  ): Promise<EsfReview> {
    const review = await this.getReview(ctx, reviewId);
    if (!review.baseline) {
      throw new Error("baseline_required_before_final_check");
    }

    const finalData = parseEsfXml(finalXmlString);
    const fields = compareEsfData(review.baseline, finalData);
    const result = calculateVerificationResult(fields);

    const newStatus = result === "errors" ? "final_mismatch" : "final_verified";

    const updated = await this.reviewRepo.update(reviewId, {
      status: newStatus,
      finalXmlFilename: filename,
      finalVerifiedAt: new Date().toISOString(),
      comparisonFields: fields,
      verificationResult: result,
    });

    await this.recordAudit(ctx, updated, "esf_final_verified");
    return updated;
  }

  async getReview(ctx: ServerContext, reviewId: string): Promise<EsfReview> {
    const review = await this.reviewRepo.get(reviewId);
    if (!review) throw new Error("esf_review_not_found");
    if (review.companyId !== ctx.user.companyId) throw new Error("not_found");
    return review;
  }

  async listReviews(ctx: ServerContext): Promise<EsfReview[]> {
    return this.reviewRepo.list(ctx.user.companyId);
  }

  private async recordAudit(
    ctx: ServerContext,
    review: EsfReview,
    action: "esf_imported" | "esf_baseline_confirmed" | "esf_final_verified",
  ): Promise<void> {
    const event: AuditEvent = {
      id: randomUUID(),
      entityType: "esf_review",
      entityId: review.id,
      action,
      actorId: ctx.user.userId,
      occurredAt: new Date().toISOString(),
      idempotencyKey: randomUUID(),
      metadata: { status: review.status },
    };
    await this.auditRepo.record(event);
  }
}
