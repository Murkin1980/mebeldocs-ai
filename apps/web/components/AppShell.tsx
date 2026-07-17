"use client";

import Link from "next/link";
import { type ReactNode, useState, useCallback } from "react";

const nav = [
  { label: "Сегодня", href: "/" },
  { label: "Создать", href: "/orders/new" },
  { label: "Заказы", href: "/orders" },
  { label: "Документы", href: "/documents" },
  { label: "Платежи", href: "/payments" },
  { label: "ЭСФ", href: "/esf/import" },
  { label: "Контрагенты", href: "/counterparties" },
  { label: "Календарь", href: "/calendar" },
];

interface AppShellProps {
  children: ReactNode;
  activePage: string;
}

export default function AppShell({ children, activePage }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <main className="shell">
      {menuOpen && <div className="sidebarOverlay open" onClick={closeMenu} role="presentation" />}
      <aside className={`sidebar${menuOpen ? " open" : ""}`} aria-label="Навигация">
        <button
          className="mobileMenuBtn"
          onClick={closeMenu}
          aria-label="Закрыть меню"
          style={{ display: "none" }}
        >
          ✕
        </button>
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
              onClick={closeMenu}
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
          <button
            className="mobileMenuBtn"
            onClick={() => setMenuOpen(true)}
            aria-label="Открыть меню навигации"
          >
            ☰
          </button>
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
