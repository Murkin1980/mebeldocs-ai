"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "../../../components/AppShell";

type SnapshotParty = {
  legalName?: string;
  name?: string;
  binIin?: string;
  address?: string;
  phone?: string;
  email?: string;
};

type InvoiceLine = {
  id: string;
  name: string;
  unit: string;
  quantityMilli: number;
  unitPriceTiyn: number;
  lineTotalTiyn: number;
};

type Invoice = {
  id: string;
  number: string;
  date: string;
  status: "draft" | "confirmed" | "posted" | "cancelled";
  sellerSnapshot: SnapshotParty;
  buyerSnapshot: SnapshotParty;
  linesSnapshot: InvoiceLine[];
  subtotalTiyn: number;
  discountTiyn: number;
  totalTiyn: number;
};

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Черновик",
  confirmed: "Подтверждён",
  posted: "Оформлен",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<Invoice["status"], string> = {
  draft: "#b2731c",
  confirmed: "#176b47",
  posted: "#3b82f6",
  cancelled: "#b34f45",
};

const STATUS_BG: Record<Invoice["status"], string> = {
  draft: "#fff1d8",
  confirmed: "#e9f4ed",
  posted: "#dbeafe",
  cancelled: "#fae4e1",
};

function formatTiyn(value: number): string {
  return (value / 100).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQty(milli: number): string {
  return (milli / 1000).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 700,
        color: STATUS_COLORS[status],
        backgroundColor: STATUS_BG[status],
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function PartyCard({ label, party }: { label: string; party: SnapshotParty }) {
  const display = party.legalName ?? party.name ?? "—";
  return (
    <article style={{ border: "1px solid #dce3df", borderRadius: 11, padding: 13, flex: 1, minWidth: 0 }}>
      <p className="eyebrow" style={{ marginBottom: 6 }}>{label}</p>
      <strong style={{ fontSize: 13 }}>{display}</strong>
      <dl style={{ display: "flex", gap: 20, flexWrap: "wrap", padding: "10px 0 0", margin: "10px 0 0", borderTop: "1px solid #edf0ee" }}>
        {party.binIin && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <dt style={{ fontSize: 8, color: "#87948d" }}>БИН/ИИН</dt>
            <dd style={{ fontSize: 10, fontWeight: 700, margin: 0 }}>{party.binIin}</dd>
          </div>
        )}
        {party.address && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <dt style={{ fontSize: 8, color: "#87948d" }}>Адрес</dt>
            <dd style={{ fontSize: 10, fontWeight: 700, margin: 0 }}>{party.address}</dd>
          </div>
        )}
        {party.phone && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <dt style={{ fontSize: 8, color: "#87948d" }}>Телефон</dt>
            <dd style={{ fontSize: 10, fontWeight: 700, margin: 0 }}>{party.phone}</dd>
          </div>
        )}
        {party.email && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <dt style={{ fontSize: 8, color: "#87948d" }}>Email</dt>
            <dd style={{ fontSize: 10, fontWeight: 700, margin: 0 }}>{party.email}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

export default function InvoiceReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить счёт");
        return res.json();
      })
      .then((data) => setInvoice(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConfirm = async () => {
    setConfirming(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/invoices/${id}/confirm`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Ошибка подтверждения");
      }
      const updated = await res.json();
      setInvoice(updated);
      setFeedback({ type: "ok", text: "Счёт подтверждён" });
    } catch (err) {
      setFeedback({ type: "err", text: (err as Error).message });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppShell activePage="Документы">
      {loading && (
        <div style={{ padding: "4rem", textAlign: "center", color: "#708078" }}>
          Загрузка…
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: "4rem", textAlign: "center", color: "#b34f45" }}>
          {error}
        </div>
      )}

      {!loading && !error && invoice && (
        <>
          <div className="titleRow">
            <div>
              <p className="eyebrow">СЧЁТ · ПРОСМОТР</p>
              <h1>Счёт №{invoice.number}</h1>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <section className="reviewCard">
            <div className="reviewHead">
              <div>
                <span className="docIcon">📄</span>
                <div>
                  <p className="eyebrow amberText">НОМЕР И ДАТА</p>
                  <h2>Счёт №{invoice.number} от {new Date(invoice.date).toLocaleDateString("ru-RU")}</h2>
                </div>
              </div>
            </div>

            <div className="compare">
              <PartyCard label="ПОСТАВЩИК" party={invoice.sellerSnapshot} />
              <div className="linkMark">⇄</div>
              <PartyCard label="ПОКУПАТЕЛЬ" party={invoice.buyerSnapshot} />
            </div>
          </section>

          <section className="reviewCard" style={{ marginTop: 15 }}>
            <div className="reviewHead">
              <div>
                <span className="docIcon">📋</span>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 3 }}>ПОЗИЦИИ СЧЁТА</p>
                  <h2>{invoice.linesSnapshot.length} поз.</h2>
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e4e9e6", textAlign: "left" }}>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#708078", fontSize: 10, letterSpacing: "0.08em" }}>Название</th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#708078", fontSize: 10, letterSpacing: "0.08em" }}>Ед.</th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#708078", fontSize: 10, letterSpacing: "0.08em", textAlign: "right" }}>Кол-во</th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#708078", fontSize: 10, letterSpacing: "0.08em", textAlign: "right" }}>Цена</th>
                    <th style={{ padding: "10px 16px", fontWeight: 600, color: "#708078", fontSize: 10, letterSpacing: "0.08em", textAlign: "right" }}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.linesSnapshot.map((line) => (
                    <tr key={line.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                      <td style={{ padding: "10px 16px", fontWeight: 500 }}>{line.name}</td>
                      <td style={{ padding: "10px 16px", color: "#708078" }}>{line.unit}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatQty(line.quantityMilli)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatTiyn(line.unitPriceTiyn)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatTiyn(line.lineTotalTiyn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "14px 16px", borderTop: "1px solid #e4e9e6", display: "flex", justifyContent: "flex-end", gap: 30 }}>
              <div style={{ textAlign: "right" }}>
                <p className="eyebrow" style={{ margin: 0 }}>ПОДИТОГ</p>
                <strong style={{ fontSize: 14 }}>{formatTiyn(invoice.subtotalTiyn)} ₸</strong>
              </div>
              {invoice.discountTiyn > 0 && (
                <div style={{ textAlign: "right" }}>
                  <p className="eyebrow" style={{ margin: 0 }}>СКИДКА</p>
                  <strong style={{ fontSize: 14, color: "#b34f45" }}>−{formatTiyn(invoice.discountTiyn)} ₸</strong>
                </div>
              )}
              <div style={{ textAlign: "right" }}>
                <p className="eyebrow" style={{ margin: 0 }}>ИТОГО</p>
                <strong style={{ fontSize: 16 }}>{formatTiyn(invoice.totalTiyn)} ₸</strong>
              </div>
            </div>
          </section>

          {feedback && (
            <div
              role="status"
              style={{
                marginTop: 15,
                padding: "10px 14px",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                background: feedback.type === "ok" ? "#eaf5ee" : "#fae4e1",
                color: feedback.type === "ok" ? "#286947" : "#a5463c",
              }}
            >
              {feedback.type === "ok" ? "✓ " : "✗ "}{feedback.text}
            </div>
          )}

          <div className="actions" style={{ marginTop: 18, display: "flex", gap: 10 }}>
            {invoice.status === "draft" && (
              <>
                <button
                  className="primary"
                  disabled={confirming}
                  onClick={handleConfirm}
                  style={{ background: "#176b47", color: "white", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 700, fontSize: 13 }}
                >
                  {confirming ? "Подтверждаем…" : "Подтвердить счёт"}
                </button>
                <a
                  href={`/api/invoices/${id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  Скачать PDF
                </a>
              </>
            )}

            {invoice.status === "confirmed" && (
              <a
                href={`/api/invoices/${id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
              >
                Скачать PDF
              </a>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
