"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/AppShell";

interface Counterparty {
  id: string;
  name: string;
}

const METHOD_OPTIONS = [
  { value: "cash", label: "Наличные" },
  { value: "bank_transfer", label: "Банковский перевод" },
  { value: "card", label: "Карта" },
] as const;

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#44524b",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #d5ddd8",
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: "0.95rem",
  outline: "none",
  fontFamily: "inherit",
  color: "var(--ink)",
  background: "white",
};

export default function NewPaymentPage() {
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("bank_transfer");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [notes, setNotes] = useState("");

  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/counterparties")
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        setCounterparties(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch(() => {});
  }, []);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!date) {
      errors.date = "Укажите дату";
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.amount = "Сумма должна быть больше 0";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const amountTiyn = Math.round(parseFloat(amount) * 100);

      const payload = {
        date,
        amountTiyn,
        method,
        counterpartyId: counterpartyId || null,
        invoiceReference: invoiceReference || null,
        notes: notes || null,
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Не удалось создать платёж");
      }

      router.push("/payments");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell activePage="Платежи">
      <div style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="eyebrow">Финансы</span>
          <h1 style={{ margin: "0.25rem 0 0" }}>Новый платёж</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="reviewCard"
            style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>Дата *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.date ? "#ef4444" : "#d5ddd8",
                }}
              />
              {fieldErrors.date && (
                <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                  {fieldErrors.date}
                </span>
              )}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Сумма (₸) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: fieldErrors.amount ? "#ef4444" : "#d5ddd8",
                }}
              />
              {fieldErrors.amount && (
                <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>
                  {fieldErrors.amount}
                </span>
              )}
              {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                <span style={{ color: "#708078", fontSize: "0.8rem" }}>
                  {(parseFloat(amount) * 100).toLocaleString("ru-RU")} тиын
                </span>
              )}
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Способ оплаты</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={inputStyle}
              >
                {METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Контрагент</label>
              <select
                value={counterpartyId}
                onChange={(e) => setCounterpartyId(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Не выбран —</option>
                {counterparties.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Ссылка на счёт</label>
              <input
                type="text"
                placeholder="Номер или ссылка на счёт-фактуру"
                value={invoiceReference}
                onChange={(e) => setInvoiceReference(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Примечания</label>
              <textarea
                placeholder="Дополнительная информация…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fde8e5",
                  color: "#b65347",
                  padding: "10px 14px",
                  borderRadius: 9,
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: "1.25rem",
            }}
          >
            <Link
              href="/payments"
              style={{
                border: "1px solid #d5ddd8",
                background: "white",
                borderRadius: 9,
                padding: "10px 14px",
                color: "#44524b",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Отмена
            </Link>
            <button
              type="submit"
              className="primary"
              disabled={submitting}
              style={{ minWidth: 160 }}
            >
              {submitting ? "Сохранение…" : "Создать платёж"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
