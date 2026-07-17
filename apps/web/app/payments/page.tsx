"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";

interface Payment {
  id: string;
  date: string;
  amountTiyn: number;
  method: "cash" | "bank_transfer" | "card";
  counterparty: string | null;
  invoiceReference: string | null;
  notes: string | null;
  status: "draft" | "matched" | "reversed";
  createdAt: string;
}

const STATUS_LABELS: Record<Payment["status"], string> = {
  draft: "Черновик",
  matched: "Сопоставлен",
  reversed: "Аннулирован",
};

const STATUS_COLORS: Record<Payment["status"], string> = {
  draft: "#a86616",
  matched: "#176b47",
  reversed: "#b65347",
};

const STATUS_BG: Record<Payment["status"], string> = {
  draft: "#fef3cd",
  matched: "#e9f4ed",
  reversed: "#fde8e5",
};

const METHOD_LABELS: Record<Payment["method"], string> = {
  cash: "Наличные",
  bank_transfer: "Банковский перевод",
  card: "Карта",
};

function formatKZT(tiyn: number): string {
  return (tiyn / 100).toLocaleString("ru-RU") + " ₸";
}

function StatusBadge({ status }: { status: Payment["status"] }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: STATUS_COLORS[status],
        backgroundColor: STATUS_BG[status],
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить платежи");
        return res.json();
      })
      .then((data) => {
        setPayments(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell activePage="Платежи">
      <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <span className="eyebrow">Финансы</span>
            <h1 style={{ margin: "0.25rem 0 0" }}>Платежи</h1>
          </div>
          <Link
            href="/payments/new"
            className="primary"
            style={{ textDecoration: "none" }}
          >
            Создать платёж
          </Link>
        </div>

        <div className="reviewCard" style={{ overflow: "hidden" }}>
          {loading && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "100%",
                      maxWidth: 600,
                      height: 36,
                      borderRadius: 6,
                      background: "linear-gradient(90deg, #eef1ef 25%, #e4e9e6 50%, #eef1ef 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {!loading && !error && payments.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
              Платежей пока нет. Нажмите «Создать платёж», чтобы создать первый.
            </div>
          )}

          {!loading && !error && payments.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.95rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #eee",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                      Дата
                    </th>
                    <th
                      style={{
                        padding: "0.75rem 1rem",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      Сумма
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                      Способ
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                      Контрагент
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                      Статус
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      style={{
                        borderBottom: "1px solid #f3f3f3",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fafafa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <td style={{ padding: "0.75rem 1rem", color: "#666" }}>
                        {new Date(payment.date).toLocaleDateString("ru-RU")}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 500,
                        }}
                      >
                        {formatKZT(payment.amountTiyn)}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {METHOD_LABELS[payment.method] ?? payment.method}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {payment.counterparty ?? "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <StatusBadge status={payment.status} />
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <Link
                          href={`/payments/${payment.id}`}
                          style={{
                            color: "var(--green)",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            textDecoration: "none",
                          }}
                        >
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
