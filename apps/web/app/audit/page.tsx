"use client";

import { useEffect, useCallback, useState } from "react";
import AppShell from "../../components/AppShell";

interface AuditEvent {
  id: string;
  createdAt: string;
  entityType: string;
  action: string;
  actor: string;
  entityId: string;
  entityLabel: string;
}

const ACTION_LABELS: Record<string, string> = {
  created: "Создано",
  updated: "Обновлено",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
};

const ENTITY_LABELS: Record<string, string> = {
  order: "Заказ",
  invoice: "Счёт",
  company_profile: "Профиль компании",
  counterparty: "Контрагент",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/audit-events")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить события");
        return res.json();
      })
      .then((data) => {
        setEvents(Array.isArray(data) ? data : data.items ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell activePage="Документы">
      <div className="titleRow">
        <div>
          <span className="eyebrow">Аудит</span>
          <h1>Журнал событий</h1>
        </div>
        <button
          className="secondary"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Обновление…" : "↻ Обновить"}
        </button>
      </div>

      <div className="reviewCard" style={{ overflow: "hidden" }}>
        {loading && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            Загрузка…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: "3rem", textAlign: "center", color: "#a5463c" }}>
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            Событий пока нет.
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.95rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Дата и время</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Тип сущности</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Действие</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Актёр</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Сущность</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr
                    key={ev.id}
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
                    <td style={{ padding: "0.75rem 1rem", color: "#666", whiteSpace: "nowrap" }}>
                      {formatDateTime(ev.createdAt)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {ENTITY_LABELS[ev.entityType] ?? ev.entityType}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {ACTION_LABELS[ev.action] ?? ev.action}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>
                      {ev.actor}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                      {ev.entityLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
