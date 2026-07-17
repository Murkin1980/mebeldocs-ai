"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/AppShell";

interface EsfDocument {
  id: string;
  number: string;
  dateIssued: string;
  dateRegistered: string;
  sellerName: string;
  sellerBin: string;
  buyerName: string;
  buyerBin: string;
  totalAmount: number;
  status:
    | "imported"
    | "baseline_confirmed"
    | "final_verified"
    | "final_mismatch";
  baselineAmount?: number;
  baselineDate?: string;
  verificationResult?: {
    matches: ComparisonRow[];
  };
}

interface ComparisonRow {
  field: string;
  expected: string;
  actual: string;
  matches: boolean;
}

const STATUS_CONFIG: Record<
  EsfDocument["status"],
  { label: string; color: string; bg: string }
> = {
  imported: { label: "Импортирован", color: "#a86616", bg: "#fef3cd" },
  baseline_confirmed: {
    label: "Baseline подтверждён",
    color: "#176b47",
    bg: "#e9f4ed",
  },
  final_verified: { label: "Пройдено", color: "#176b47", bg: "#e9f4ed" },
  final_mismatch: { label: "Расхождение", color: "#b65347", bg: "#fde8e5" },
};

function StatusBadge({ status }: { status: EsfDocument["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
      }}
    >
      {cfg.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "0.7rem", color: "#708078", fontWeight: 700, letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function formatKZT(tiyn: number): string {
  return (tiyn / 100).toLocaleString("ru-RU") + " ₸";
}

export default function EsfReviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [doc, setDoc] = useState<EsfDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDoc = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/esf/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить ЭСФ");
        return res.json();
      })
      .then(setDoc)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  async function confirmBaseline() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/esf/${id}/baseline`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Не удалось подтвердить baseline");
      }
      fetchDoc();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell activePage="ЭСФ">
      <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="eyebrow">Электронный счёт-фактура</span>
          <h1 style={{ margin: "0.25rem 0 0" }}>Просмотр ЭСФ</h1>
        </div>

        {loading && (
          <div
            className="reviewCard"
            style={{ padding: "3rem", textAlign: "center", color: "#888" }}
          >
            Загрузка…
          </div>
        )}

        {!loading && error && (
          <div
            className="reviewCard"
            style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}
          >
            {error}
          </div>
        )}

        {!loading && !error && doc && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                ЭСФ №{doc.number}
              </h2>
              <StatusBadge status={doc.status} />
            </div>

            <div className="reviewCard">
              <div className="reviewHead">
                <div>
                  <div
                    className="docIcon"
                    style={{
                      background: "#edf4ef",
                      color: "var(--green)",
                      fontSize: 14,
                    }}
                  >
                    ЭСФ
                  </div>
                  <div>
                    <h2 style={{ fontSize: "0.95rem" }}>
                      Счёт-фактура №{doc.number}
                    </h2>
                    <span style={{ fontSize: "0.8rem", color: "#708078" }}>
                      {new Date(doc.dateIssued).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                <InfoRow
                  label="Поставщик"
                  value={`${doc.sellerName} (${doc.sellerBin})`}
                />
                <InfoRow
                  label="Покупатель"
                  value={`${doc.buyerName} (${doc.buyerBin})`}
                />
                <InfoRow
                  label="Дата регистрации"
                  value={
                    doc.dateRegistered
                      ? new Date(doc.dateRegistered).toLocaleDateString("ru-RU")
                      : "—"
                  }
                />
                <InfoRow
                  label="Сумма"
                  value={formatKZT(doc.totalAmount)}
                />
              </div>

              {doc.status === "imported" && doc.baselineAmount != null && (
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid var(--line)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#708078", fontWeight: 700 }}>
                      BASELINE СУММА
                    </span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                      {formatKZT(doc.baselineAmount)}
                    </div>
                  </div>
                </div>
              )}

              {doc.status === "imported" && (
                <div
                  className="actions"
                  style={{ justifyContent: "flex-end" }}
                >
                  <button
                    className="primary"
                    disabled={actionLoading}
                    onClick={confirmBaseline}
                  >
                    {actionLoading ? "Подтверждение…" : "Подтвердить baseline"}
                  </button>
                </div>
              )}

              {doc.status === "baseline_confirmed" && (
                <div
                  className="actions"
                  style={{ justifyContent: "flex-end" }}
                >
                  <Link
                    href={`/esf/${id}/final-check`}
                    className="primary"
                    style={{ textDecoration: "none" }}
                  >
                    Загрузить финальный XML
                  </Link>
                </div>
              )}

              {doc.status === "final_verified" && (
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid var(--line)",
                    textAlign: "center",
                    background: "#f0f7f3",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 16px",
                      borderRadius: 9999,
                      background: "var(--green)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    Пройдено
                  </span>
                </div>
              )}

              {doc.status === "final_mismatch" && (
                <div
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid var(--line)",
                    textAlign: "center",
                    background: "#fdf2f0",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 16px",
                      borderRadius: 9999,
                      background: "#b65347",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    Расхождение
                  </span>
                </div>
              )}
            </div>

            {doc.status === "final_mismatch" &&
              doc.verificationResult?.matches &&
              doc.verificationResult.matches.length > 0 && (
                <div className="reviewCard" style={{ marginTop: "1rem", overflow: "hidden" }}>
                  <div className="reviewHead">
                    <div>
                      <h2 style={{ fontSize: "0.95rem" }}>
                        Сравнение baseline и финального ЭСФ
                      </h2>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.9rem",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid #eee",
                            textAlign: "left",
                          }}
                        >
                          <th
                            style={{
                              padding: "0.75rem 1rem",
                              fontWeight: 600,
                            }}
                          >
                            Поле
                          </th>
                          <th
                            style={{
                              padding: "0.75rem 1rem",
                              fontWeight: 600,
                            }}
                          >
                            Ожидается (baseline)
                          </th>
                          <th
                            style={{
                              padding: "0.75rem 1rem",
                              fontWeight: 600,
                            }}
                          >
                            Фактически
                          </th>
                          <th
                            style={{
                              padding: "0.75rem 1rem",
                              fontWeight: 600,
                              textAlign: "center",
                            }}
                          >
                            Статус
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.verificationResult.matches.map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: "1px solid #f3f3f3",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                fontWeight: 500,
                              }}
                            >
                              {row.field}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                color: "#708078",
                              }}
                            >
                              {row.expected}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                              }}
                            >
                              {row.actual}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                textAlign: "center",
                              }}
                            >
                              {row.matches ? (
                                <span style={{ color: "var(--green)", fontWeight: 700 }}>
                                  ✓
                                </span>
                              ) : (
                                <span style={{ color: "#b65347", fontWeight: 700 }}>
                                  ✗
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </AppShell>
  );
}
