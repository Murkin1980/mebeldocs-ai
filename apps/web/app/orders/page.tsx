"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";

interface Order {
  id: string;
  number: string;
  date: string;
  counterparty: string;
  amount: number;
  status: "draft" | "confirmed" | "posted" | "cancelled";
}

const STATUS_LABELS: Record<Order["status"], string> = {
  draft: "Черновик",
  confirmed: "Подтверждён",
  posted: "Оформлен",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  draft: "#f59e0b",
  confirmed: "#22c55e",
  posted: "#3b82f6",
  cancelled: "#ef4444",
};

const STATUS_BG: Record<Order["status"], string> = {
  draft: "#fef9c3",
  confirmed: "#dcfce7",
  posted: "#dbeafe",
  cancelled: "#fee2e2",
};

function formatKZT(amount: number): string {
  return amount.toLocaleString("ru-RU") + " ₸";
}

function StatusBadge({ status }: { status: Order["status"] }) {
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить заказы");
        return res.json();
      })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell activePage="Заказы">
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
            <span className="eyebrow">Документы</span>
            <h1 style={{ margin: "0.25rem 0 0" }}>Заказы</h1>
          </div>
          <Link href="/orders/new" className="primary" style={{ textDecoration: "none" }}>
            + Новый заказ
          </Link>
        </div>

        <div className="reviewCard" style={{ overflow: "hidden" }}>
          {loading && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
              Загрузка…
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
              Заказов пока нет. Нажмите «Новый заказ», чтобы создать первый.
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.95rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Номер</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Дата</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Контрагент</th>
                    <th
                      style={{
                        padding: "0.75rem 1rem",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      Сумма
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => {
                        window.location.href = `/orders/${order.id}`;
                      }}
                      style={{
                        borderBottom: "1px solid #f3f3f3",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fafafa")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                        {order.number}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#666" }}>
                        {new Date(order.date).toLocaleDateString("ru-RU")}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>{order.counterparty}</td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 500,
                        }}
                      >
                        {formatKZT(order.amount)}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <StatusBadge status={order.status} />
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
