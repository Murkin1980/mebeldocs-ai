export type PilotCounts = {
  counterparties: number;
  nomenclatureCandidates: number;
  activeOutgoingEsf: number;
  documentVersionClusters: number;
  documentToEsfProposals: number;
  paymentToInvoiceProposals: number;
};

export type ReviewTask = {
  id: string;
  title: string;
  detail: string;
  count: number;
  severity: "review" | "warning" | "info";
};

export type PilotPublicSnapshot = {
  schemaVersion: 1;
  sourceMode: "pilot" | "demo";
  generatedAt: string | null;
  counts: PilotCounts;
  summary: { ready: number; review: number; errors: number; unreadable: number };
  reviewTasks: ReviewTask[];
};

export const demoCounts: PilotCounts = {
  counterparties: 19,
  nomenclatureCandidates: 247,
  activeOutgoingEsf: 27,
  documentVersionClusters: 20,
  documentToEsfProposals: 51,
  paymentToInvoiceProposals: 4,
};

export function toPublicSnapshot(
  counts: PilotCounts,
  options: { sourceMode: "pilot" | "demo"; generatedAt?: string | null; versionReviews?: number } = { sourceMode: "demo" },
): PilotPublicSnapshot {
  const versionReviews = options.versionReviews ?? 14;
  return {
    schemaVersion: 1,
    sourceMode: options.sourceMode,
    generatedAt: options.generatedAt ?? null,
    counts,
    summary: {
      ready: counts.counterparties + counts.nomenclatureCandidates,
      review: versionReviews,
      errors: counts.paymentToInvoiceProposals + 1,
      unreadable: 0,
    },
    reviewTasks: [
      { id: "versions", title: "Версии документов", detail: "Пары PDF/XLSX и копии в разных папках", count: versionReviews, severity: "review" },
      { id: "document-links", title: "Связи с ЭСФ", detail: "Предложения по сумме, стороне и дате", count: counts.documentToEsfProposals, severity: "info" },
      { id: "payment-links", title: "Платежи и счета", detail: "Связи требуют подтверждения владельца", count: counts.paymentToInvoiceProposals, severity: "warning" },
      { id: "company", title: "Профиль компании", detail: "Проверьте основные реквизиты перед импортом", count: 1, severity: "review" },
    ],
  };
}

export const demoSnapshot = toPublicSnapshot(demoCounts, { sourceMode: "demo" });
