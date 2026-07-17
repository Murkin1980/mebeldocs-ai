# CHECKPOINT

## 2026-07-17 — Этап 2: Первый Vertical Slice завершён

### Фактическое состояние

- **103 теста** проходят (89 unit + 6 integration + 3 PDF + 5 существующих)
- **TypeScript** компилируется без ошибок (`tsc --noEmit`)
- **Production build** проходит (19 маршрутов: 6 static + 13 dynamic)
- **19 API routes** работают через service locator

### Что работает

1. **Профиль компании** — CRUD через API, просмотр в UI
2. **Контрагенты** — создание и список через API
3. **Заказы** — создание с позициями, просмотр деталей, подтверждение
4. **Инвойсы** — создание из заказа, просмотр, подтверждение
5. **PDF генерация** — A4 формат, таблица товаров, итоги (без кириллицы)
6. **Audit log** — append-only JSON файлы с idempotency
7. **State machine** — draft→confirmed→posted/cancelled для Order и Invoice
8. **Деньги** — целочисленные тийны без float-арифметики

### Ключевые файлы

- Домен: `lib/domain/` (money, entities, state-machine, calculations, validation, repository)
- Хранилище: `lib/storage/local-repositories.ts`
- Сервисы: `lib/application/` + `lib/services.ts`
- API: `app/api/*/route.ts` (11 маршрутов)
- UI: `app/orders/`, `app/invoices/`, `app/audit/`, `components/AppShell.tsx`
- PDF: `lib/pdf-generator.ts`
- Тесты: `tests/domain.test.ts`, `tests/integration.test.ts`, `tests/pdf.test.ts`

### Известные ограничения

1. **PDF кириллица** — StandardFonts Helvetica не поддерживает кириллицу. Нужен DejaVu Sans TTF
2. **Нет экрана редактирования** профиля компании
3. **Нет экрана списка** контрагентов
4. **`@pdf-lib/fontkit`** установлен но не используется
5. **ESLint** не настроен (Next.js 16 удалил `next lint`)

### Следующие шаги

1. Внедрить DejaVu Sans TTF для PDF кириллицы
2. Добавить UI редактирования профиля компании
3. Добавить UI списка контрагентов
4. Настроить ESLint
