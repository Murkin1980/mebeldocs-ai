import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MebelDocs AI — Разбор архива",
  description: "Безопасный помощник по документообороту мебельного бизнеса",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
