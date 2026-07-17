"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "../../../../components/AppShell";

export default function EsfFinalCheckPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setError(null);

    if (!f.name.toLowerCase().endsWith(".xml")) {
      setError("Принимаются только .xml файлы");
      return;
    }

    setFile(f);

    const reader = new FileReader();
    reader.onload = () => {
      setXmlContent(reader.result as string);
    };
    reader.onerror = () => {
      setError("Не удалось прочитать файл");
    };
    reader.readAsText(f);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleSubmit() {
    if (!xmlContent || !file) {
      setError("Сначала выберите файл");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch(`/api/esf/${id}/final-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xml: xmlContent,
          filename: file.name,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Не удалось загрузить финальный XML");
      }

      router.push(`/esf/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell activePage="ЭСФ">
      <div style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="eyebrow">Электронный счёт-фактура</span>
          <h1 style={{ margin: "0.25rem 0 0" }}>Финальная проверка</h1>
        </div>

        <div
          style={{
            background: "#fef3cd",
            border: "1px solid #f5d67a",
            borderRadius: 9,
            padding: "12px 14px",
            marginBottom: "1.25rem",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            fontSize: "0.9rem",
            color: "#a86616",
          }}
        >
          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>⚠</span>
          <span>
            Загрузите финальный XML, выгруженный из ИС ЭСФ после регистрации.
          </span>
        </div>

        <div className="reviewCard" style={{ padding: "1.5rem" }}>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--green)" : "#d5ddd8"}`,
              borderRadius: 14,
              padding: "3rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "var(--mint)" : "#fafbfa",
              transition: "all 0.2s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--mint)",
                color: "var(--green)",
                display: "grid",
                placeItems: "center",
                fontSize: "1.5rem",
                fontWeight: 800,
              }}
            >
              ↑
            </div>
            <div>
              <strong style={{ fontSize: "0.95rem" }}>
                Перетащите финальный XML-файл
              </strong>
              <br />
              <span style={{ color: "#708078", fontSize: "0.85rem" }}>
                или нажмите, чтобы выбрать файл
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#aab5af" }}>
              Формат: .xml (выгрузка из ИС ЭСФ)
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xml"
            onChange={onInputChange}
            style={{ display: "none" }}
          />

          {file && (
            <div
              style={{
                marginTop: "1rem",
                padding: "12px 14px",
                background: "#f0f5f2",
                borderRadius: 9,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 31,
                    borderRadius: 5,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    background: "#edf4ef",
                    color: "var(--green)",
                  }}
                >
                  XML
                </div>
                <div>
                  <strong style={{ fontSize: "0.85rem" }}>{file.name}</strong>
                  <br />
                  <span style={{ fontSize: "0.75rem", color: "#708078" }}>
                    {(file.size / 1024).toFixed(1)} КБ
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setXmlContent(null);
                  setError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                style={{
                  border: "1px solid #d5ddd8",
                  background: "white",
                  borderRadius: 7,
                  padding: "5px 10px",
                  fontSize: "0.8rem",
                  color: "#708078",
                }}
              >
                Убрать
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "1rem",
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: "1.25rem",
            }}
          >
            <Link
              href={`/esf/${id}`}
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
              Назад
            </Link>
            <button
              type="button"
              className="primary"
              disabled={uploading || !xmlContent}
              onClick={handleSubmit}
              style={{ minWidth: 160 }}
            >
              {uploading ? "Проверка…" : "Загрузить и проверить"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
