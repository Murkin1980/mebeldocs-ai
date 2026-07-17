"use client";

import Link from "next/link";
import { type ReactNode } from "react";

const nav = [
  { label: "Сегодня", href: "/" },
  { label: "Создать", href: "/orders/new" },
  { label: "Заказы", href: "/orders" },
  { label: "Документы", href: "/documents" },
  { label: "Контрагенты", href: "/counterparties" },
  { label: "Календарь", href: "/calendar" },
];

interface AppShellProps {
  children: ReactNode;
  activePage: string;
}

export default function AppShell({ children, activePage }: AppShellProps) {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandMark">M</span>
          <span>
            MebelDocs <b>AI</b>
          </span>
        </div>
        <div className="company">
          <span className="avatar">ГМ</span>
          <div>
            <strong>Гранд Мебель</strong>
            <small>Пилотная компания</small>
          </div>
          <span>⌄</span>
        </div>
        <nav>
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={activePage === item.label ? "active" : ""}
            >
              <span className="navDot" />
              {item.label}
              {item.label === "Календарь" && <i>3</i>}
            </Link>
          ))}
        </nav>
        <div className="sidebarFoot">
          <button>
            <span className="navDot" />
            Настройки
          </button>
          <div className="user">
            <span className="avatar muted">АМ</span>
            <div>
              <strong>Айдос</strong>
              <small>Владелец</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="sandboxDot" /> ПЕСОЧНИЦА{" "}
            <em>Ничего не отправляется</em>
          </div>
          <button className="reset">↻ Сбросить демо</button>
        </header>
        <div className="content">{children}</div>
      </section>
    </main>
  );
}
