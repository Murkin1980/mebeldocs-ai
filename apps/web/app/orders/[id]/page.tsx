"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";

type OrderStatus = "draft" | "confirmed" | "posted" | "cancelled";

interface OrderLine {
  id: string;
  name: string;
  description?: string;
  quantityMilli: number;
  unit: string;
  unitPriceTiyn: number;
  discountTiyn: number;
  lineTotalTiyn: number;
}

interface Order {
  id: string;
  counterpartyId: string;
  date: string;
  contractNumber?: string;
  contractDate?: string;
  notes?: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotalTiyn: number;
  discountTiyn: number;
  totalTiyn: number;
  createdAt: string;
}

interface Counterparty {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Черновик",
  confirmed: "Подтверждён",
  posted: "Оформлен",
  cancelled: "Отменён",
};

const STATUS_BG: Record<OrderStatus, string> = {
  draft: "#fef9c3",
  confirmed: "#dcfce7",
  posted: "#dbeafe",
  cancelled: "#fee2e2",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  draft: "#a86616",
  confirmed: "#176b47",
  posted: "#2563eb",
  cancelled: "#dc2626",
};

function fmtMoney(tiyn: number): string {
  const tenge = tiyn / 100;
  return tenge.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₸";
}

function fmtQty(milli: number): string {
  return (milli / 1000).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: 700,
        color: STATUS_COLOR[status],
        backgroundColor: STATUS_BG[status],
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      const [orderRes, cpRes] = await Promise.all([
        fetch(`/api/orders/${id}`),
        fetch("/api/counterparties"),
      ]);
      if (!orderRes.ok) {
        if (orderRes.status === 404) throw new Error("Заказ не найден");
        throw new Error("Не удалось загрузить заказ");
      }
      const orderData = await orderRes.json();
      const cpData = await cpRes.json();
      setOrder(orderData);
      setCounterparties(Array.isArray(cpData) ? cpData : []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const counterpartyName = order
    ? counterparties.find((c) => c.id === order.counterpartyId)?.name ?? "—"
    : "—";

  async function handleConfirm() {
    setActionLoading("confirm");
    try {
      const res = await fetch(`/api/orders/${id}/confirm`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Ошибка");
      const updated = await res.json();
      setOrder(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateInvoice() {
    setActionLoading("invoice");
    try {
      const res = await fetch(`/api/orders/${id}/invoices`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Ошибка");
      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError((err as Error).message);
      setActionLoading(null);
    }
  }

  return (
    <AppShell activePage="Заказы">
      {loading && (
        <div style={{ padding: "4rem", textAlign: "center", color: "#708078" }}>
          Загрузка…
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#a5463c",
            background: "#fee2e2",
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && order && (
        <>
          <div className="titleRow">
            <div>
              <span className="eyebrow">Документы</span>
              <h1 style={{ margin: "4px 0 0" }}>Заказ #{order.id.slice(0, 8)}</h1>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div
            className="reviewCard"
            style={{ marginTop: 20 }}
          >
            <div style={{ padding: "18px 22px" }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                Реквизиты
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 32px", fontSize: "0.9rem" }}>
                <div>
                  <div style={{ color: "#708078", fontSize: "0.75rem", marginBottom: 2 }}>Номер</div>
                  <div style={{ fontWeight: 600 }}>#{order.id.slice(0, 8)}</div>
                </div>
                <div>
                  <div style={{ color: "#708078", fontSize: "0.75rem", marginBottom: 2 }}>Дата</div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(order.date).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#708078", fontSize: "0.75rem", marginBottom: 2 }}>Контрагент</div>
                  <div style={{ fontWeight: 600 }}>{counterpartyName}</div>
                </div>
                {order.contractNumber && (
                  <div>
                    <div style={{ color: "#708078", fontSize: "0.75rem", marginBottom: 2 }}>Договор</div>
                    <div style={{ fontWeight: 600 }}>
                      №{order.contractNumber}
                      {order.contractDate && (
                        <> от {new Date(order.contractDate).toLocaleDateString("ru-RU")}</>
                      )}
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ color: "#708078", fontSize: "0.75rem", marginBottom: 2 }}>Комментарий</div>
                    <div style={{ fontWeight: 500 }}>{order.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="reviewCard" style={{ marginTop: 14, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 0" }}>
              <div className="eyebrow">Позиции</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                  marginTop: 12,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                    <th style={{ padding: "10px 22px", fontWeight: 600, color: "#708078", fontSize: "0.78rem" }}>
                      Название
                    </th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#708078", fontSize: "0.78rem" }}>
                      Ед.
                    </th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#708078", fontSize: "0.78rem", textAlign: "right" }}>
                      Кол-во
                    </th>
                    <th style={{ padding: "10px 12px", fontWeight: 600, color: "#708078", fontSize: "0.78rem", textAlign: "right" }}>
                      Цена
                    </th>
                    <th style={{ padding: "10px 22px", fontWeight: 600, color: "#708078", fontSize: "0.78rem", textAlign: "right" }}>
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr
                      key={line.id}
                      style={{ borderBottom: "1px solid #f0f3f1" }}
                    >
                      <td style={{ padding: "11px 22px", fontWeight: 500 }}>
                        {line.name}
                        {line.description && (
                          <div style={{ fontSize: "0.8rem", color: "#708078", marginTop: 2 }}>
                            {line.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", color: "#708078" }}>{line.unit}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {fmtQty(line.quantityMilli)}
                      </td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {fmtMoney(line.unitPriceTiyn)}
                      </td>
                      <td style={{ padding: "11px 22px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {fmtMoney(line.lineTotalTiyn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "14px 22px 18px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, fontSize: "0.9rem" }}>
                <div style={{ display: "flex", gap: 40 }}>
                  <span style={{ color: "#708078" }}>Подытог</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 140, textAlign: "right" }}>
                    {fmtMoney(order.subtotalTiyn)}
                  </span>
                </div>
                {order.discountTiyn > 0 && (
                  <div style={{ display: "flex", gap: 40 }}>
                    <span style={{ color: "#708078" }}>Скидка</span>
                    <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 140, textAlign: "right", color: "#a5463c" }}>
                      −{fmtMoney(order.discountTiyn)}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 40,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    borderTop: "1px solid var(--line)",
                    paddingTop: 8,
                    width: "100%",
                  }}
                >
                  <span>Итого</span>
                  <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 140, textAlign: "right" }}>
                    {fmtMoney(order.totalTiyn)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(order.status === "draft" || order.status === "confirmed") && (
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 18,
                justifyContent: "flex-end",
              }}
            >
              {order.status === "draft" && (
                <button
                  className="secondary"
                  onClick={handleConfirm}
                  disabled={actionLoading === "confirm"}
                  style={{ borderRadius: 9, padding: "10px 18px", fontWeight: 700 }}
                >
                  {actionLoading === "confirm" ? "…" : "Подтвердить заказ"}
                </button>
              )}
              <button
                className="primary"
                onClick={handleCreateInvoice}
                disabled={actionLoading === "invoice"}
                style={{
                  borderRadius: 9,
                  padding: "10px 18px",
                  fontWeight: 700,
                  background: "#176b47",
                  color: "white",
                  border: "none",
                }}
              >
                {actionLoading === "invoice" ? "…" : "Создать счёт"}
              </button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
