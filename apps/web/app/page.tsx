"use client";

import { useMemo, useState } from "react";

type ReviewState = "review" | "accepted" | "separate";

const nav = ["Сегодня", "Создать", "Заказы", "Документы", "Контрагенты", "Календарь"];
const steps = ["Загрузка", "Проверка", "Извлечение", "Подтверждение"];
const groups = [
  { label: "Готово к импорту", value: 249, tone: "green", note: "19 контрагентов · 230 позиций" },
  { label: "Нужно подтвердить", value: 14, tone: "amber", note: "Версии и совпадения" },
  { label: "Возможные ошибки", value: 5, tone: "red", note: "Даты, номера, связи" },
  { label: "Не удалось прочитать", value: 3, tone: "slate", note: "Нужен оригинал или OCR" },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Документы");
  const [state, setState] = useState<ReviewState>("review");
  const [chatOpen, setChatOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  const remaining = useMemo(() => (state === "review" ? 14 : 13), [state]);
  const send = () => {
    if (!message.trim()) return;
    setMessages((items) => [...items, message.trim()]);
    setMessage("");
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">M</span><span>MebelDocs <b>AI</b></span></div>
        <div className="company"><span className="avatar">ГМ</span><div><strong>Гранд Мебель</strong><small>Пилотная компания</small></div><span>⌄</span></div>
        <nav>
          {nav.map((item) => <button key={item} className={activeNav === item ? "active" : ""} onClick={() => setActiveNav(item)}><span className="navDot" />{item}{item === "Календарь" && <i>3</i>}</button>)}
        </nav>
        <div className="sidebarFoot"><button><span className="navDot" />Настройки</button><div className="user"><span className="avatar muted">АМ</span><div><strong>Айдос</strong><small>Владелец</small></div></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="sandboxDot" /> ПЕСОЧНИЦА <em>Ничего не отправляется</em></div>
          <button className="reset">↻ Сбросить демо</button>
        </header>
        <div className="content">
          <div className="titleRow"><div><p className="eyebrow">ИМПОРТ АРХИВА · ШАГ 4 ИЗ 4</p><h1>Проверьте найденные данные</h1><p>Оригиналы сохранены без изменений. Подтвердите предложения перед импортом.</p></div><button className="secondary">Посмотреть отчёт</button></div>
          <div className="stepper">{steps.map((step, i) => <div className="step" key={step}><span className={i < 3 ? "done" : "current"}>{i < 3 ? "✓" : "4"}</span><b>{step}</b>{i < 3 && <small>Готово</small>}{i < steps.length - 1 && <hr />}</div>)}</div>
          <div className="stats">{groups.map((g) => <article key={g.label} className={`stat ${g.tone}`}><div><span>{g.label}</span><strong>{g.value}</strong></div><small>{g.note}</small></article>)}</div>

          <section className="reviewCard">
            <div className="reviewHead"><div><span className="docIcon">▤</span><div><p className="eyebrow amberText">НУЖНО ПОДТВЕРДИТЬ · {remaining} ОСТАЛОСЬ</p><h2>Это версии одного документа?</h2></div></div><span className="confidence">Уверенность 86%</span></div>
            <div className="compare">
              <article><div className="fileTop"><span className="xlsx">X</span><div><strong>Счёт №32 от 05.05.2026</strong><small>Excel · исходник для редактирования</small></div><b>ОСНОВНОЙ?</b></div><dl><div><dt>Сумма</dt><dd>590 000 ₸</dd></div><div><dt>Контрагент</dt><dd>Freedom Life</dd></div><div><dt>Изменён</dt><dd>05 мая, 14:32</dd></div></dl><button className="source">↗ Открыть источник</button></article>
              <div className="linkMark">↔</div>
              <article><div className="fileTop"><span className="pdf">P</span><div><strong>Счёт №32 от 05.05.2026</strong><small>PDF · версия для отправки</small></div><b>С ПЕЧАТЬЮ</b></div><dl><div><dt>Сумма</dt><dd>590 000 ₸</dd></div><div><dt>Контрагент</dt><dd>Freedom Life</dd></div><div><dt>Изменён</dt><dd>05 мая, 14:41</dd></div></dl><button className="source">↗ Открыть источник</button></article>
            </div>
            <div className="reason"><span>✦</span><p><strong>Почему мы так думаем</strong>Совпадают номер, дата, сумма и контрагент. PDF создан через 9 минут после Excel и содержит печать.</p></div>
            <div className="actions"><button onClick={() => setState("separate")} className={state === "separate" ? "selected" : ""}>Это разные документы</button><button onClick={() => setState("accepted")} className="primary">✓ Да, объединить как версии</button></div>
          </section>
          <div className="importBar"><div><strong>249 записей готовы к импорту</strong><small>Неподтверждённые данные останутся задачами и не попадут в документы.</small></div><button className="primary">Импортировать подтверждённое →</button></div>
        </div>
      </section>

      {chatOpen ? <aside className="assistant">
        <div className="assistantHead"><div><span className="aiAvatar">✦</span><div><strong>AI-помощник</strong><small><i /> Готов помочь</small></div></div><button onClick={() => setChatOpen(false)}>×</button></div>
        <div className="chatBody"><div className="aiMessage"><p>Я нашёл две версии счёта №32.</p><p>Предлагаю оставить Excel основным файлом, а PDF — зафиксированной версией для отправки.</p><div className="citation">▤ 2 источника · <u>показать</u></div></div>
          <div className="quick"><span>Можно спросить:</span><button>В чём разница?</button><button>Что значит «основной»?</button><button>Покажи следующие ошибки</button></div>
          {messages.map((m, i) => <div className="userMessage" key={i}>{m}</div>)}
        </div>
        <div className="composer"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Спросите о найденных данных…" /><div><button>＋</button><small>ИИ может ошибаться · проверяйте важное</small><button className="send" onClick={send}>↑</button></div></div>
      </aside> : <button className="chatFab" onClick={() => setChatOpen(true)}>✦</button>}
    </main>
  );
}
