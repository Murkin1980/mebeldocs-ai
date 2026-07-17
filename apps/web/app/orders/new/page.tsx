"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../components/AppShell";

interface Counterparty {
  id: string;
  name: string;
}

interface OrderLine {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  pricePerUnitTiyn: number;
}

let lineIdSeq = 0;
function makeLine(): OrderLine {
  return {
    id: `line-${++lineIdSeq}`,
    name: "",
    unit: "шт",
    quantity: 1,
    pricePerUnitTiyn: 0,
  };
}

function formatKZT(tiyn: number): string {
  const tenge = tiyn / 100;
  return tenge.toLocaleString("ru-RU", { minimumFractionDigits: 0 }) + " ₸";
}

export default function NewOrderPage() {
  const router = useRouter();

  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [counterpartyId, setCounterpartyId] = useState("");
  const [comment, setComment] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([makeLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/counterparties")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить контрагентов");
        return res.json();
      })
      .then((data) => {
        setCounterparties(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch(() => {});
  }, []);

  function updateLine(id: string, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  function addLine() {
    setLines((prev) => [...prev, makeLine()]);
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + l.quantity * l.pricePerUnitTiyn,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!counterpartyId) {
      setError("Выберите контрагента");
      return;
    }
    if (lines.every((l) => !l.name.trim())) {
      setError("Добавьте хотя бы одну позицию");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterpartyId,
          comment: comment.trim() || undefined,
          lines: lines
            .filter((l) => l.name.trim())
            .map((l) => ({
              name: l.name.trim(),
              unit: l.unit || "шт",
              quantity: l.quantity,
              pricePerUnitTiyn: l.pricePerUnitTiyn,
            })),
        }),
      });
      if (!res.ok) throw new Error("Не удалось создать заказ");
      router.push("/orders");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell activePage="Создать">
      <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
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
            <h1 style={{ margin: "0.25rem 0 0" }}>Новый заказ</h1>
          </div>
          <Link
            href="/orders"
            style={{ textDecoration: "none" }}
            className="secondary"
          >
            ← К списку
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Counterparty + comment */}
          <div className="reviewCard" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <span className="eyebrow" style={{ color: "#7a8a82" }}>
              ОСНОВНЫЕ ДАННЫЕ
            </span>

            <div style={{ marginTop: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#44524b",
                  marginBottom: "0.35rem",
                }}
              >
                Контрагент *
              </label>
              <select
                value={counterpartyId}
                onChange={(e) => setCounterpartyId(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #d5ddd8",
                  borderRadius: 9,
                  fontSize: "0.95rem",
                  background: "white",
                  color: "#18221d",
                  outline: "none",
                }}
              >
                <option value="">— Выберите контрагента —</option>
                {counterparties.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: "0.85rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#44524b",
                  marginBottom: "0.35rem",
                }}
              >
                Комментарий
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Необязательный комментарий к заказу"
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #d5ddd8",
                  borderRadius: 9,
                  fontSize: "0.95rem",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Order lines */}
          <div className="reviewCard" style={{ overflow: "hidden", marginBottom: "1rem" }}>
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #e4e9e6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span className="eyebrow" style={{ margin: 0, color: "#7a8a82" }}>
                ПОЗИЦИИ ЗАКАЗА
              </span>
              <button
                type="button"
                onClick={addLine}
                style={{
                  border: "1px solid #d5ddd8",
                  background: "white",
                  borderRadius: 9,
                  padding: "0.4rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#44524b",
                }}
              >
                + Добавить
              </button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={line.id}
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom:
                    idx < lines.length - 1 ? "1px solid #f3f3f3" : undefined,
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 0.8fr 1.3fr 1fr auto",
                  gap: "0.6rem",
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={labelStyle}>Название</label>
                  <input
                    type="text"
                    value={line.name}
                    onChange={(e) => updateLine(line.id, "name", e.target.value)}
                    placeholder="Наименование позиции"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ед. изм.</label>
                  <input
                    type="text"
                    value={line.unit}
                    onChange={(e) => updateLine(line.id, "unit", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Кол-во</label>
                  <input
                    type="number"
                    min={0}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.id, "quantity", Number(e.target.value))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Цена за ед. (тиын)</label>
                  <input
                    type="number"
                    min={0}
                    value={line.pricePerUnitTiyn}
                    onChange={(e) =>
                      updateLine(
                        line.id,
                        "pricePerUnitTiyn",
                        Number(e.target.value)
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Сумма</label>
                  <div
                    style={{
                      ...inputStyle,
                      background: "#f5f7f5",
                      cursor: "default",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatKZT(line.quantity * line.pricePerUnitTiyn)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 1}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: lines.length <= 1 ? "#ccc" : "#b65347",
                    fontSize: "1.1rem",
                    cursor: lines.length <= 1 ? "default" : "pointer",
                    padding: "0.3rem",
                    marginBottom: 2,
                  }}
                  title="Удалить позицию"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div
            className="reviewCard"
            style={{
              padding: "1rem 1.5rem",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="eyebrow" style={{ margin: 0, color: "#7a8a82" }}>
              ИТОГО
            </span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: "#176b47",
              }}
            >
              {formatKZT(subtotal)}
            </span>
          </div>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#a5463c",
                borderRadius: 9,
                padding: "0.65rem 1rem",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
            }}
          >
            <Link
              href="/orders"
              className="secondary"
              style={{ textDecoration: "none", padding: "0.6rem 1.2rem" }}
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="primary"
              style={{
                padding: "0.6rem 1.5rem",
                fontSize: "0.95rem",
              }}
            >
              {submitting ? "Создаём…" : "Создать заказ"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "#708078",
  marginBottom: "0.25rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.65rem",
  border: "1px solid #d5ddd8",
  borderRadius: 9,
  fontSize: "0.9rem",
  background: "white",
  color: "#18221d",
  outline: "none",
};
