# PROJECT_PROGRESS

## Текущий статус: Этап 2 — Первый Vertical Slice завершён

### Метрики

| Метрика | Значение |
|---------|----------|
| Тесты | 103/103 pass |
| TypeScript | 0 ошибок |
| Build | 19 маршрутов, OK |
| API routes | 14 (11 новых + 3 существующих) |
| UI pages | 6 (orders list, new, detail, invoice review, audit, home) |
| Unit tests | 89 (money, state machine, calculations, validation) |
| Integration tests | 6 (CRUD, order→invoice flow, idempotency) |
| PDF tests | 3 (valid bytes, structure, save) |

### Завершённые этапы

- [x] Этап 0 — Основание проекта
- [x] Этап 1 — Инвентаризация и модель данных
- [~] Этап 2 — Прототип документооборота (горизонтальный срез готов)

### Текущий этап: Этап 2 (продолжение)

**Готово:**
- Профиль компании (API CRUD)
- Контрагенты (API create/list)
- Заказы с позициями (API CRUD + confirm)
- Инвойсы (API create from order + confirm + PDF)
- PDF генерация (A4, таблица, итоги)
- Audit log (append-only JSON)
- State machine (draft→confirmed→posted/cancelled)
- Деньги (целочисленные тийны)
- UI: список заказов, создание заказа, детали заказа, просмотр инвойса, история audit

**Не сделано в Этапе 2:**
- Генерация З-2 и Р-1
- UI редактирования профиля компании
- UI списка контрагентов
- PDF кириллица (Helvetica не поддерживает)
- Экран полной истории решений с фильтрами

### Блокеры

1. DejaVu Sans TTF повреждены при скачивании — кириллица в PDF не отображается
2. ESLint не настроен (Next.js 16 удалил `next lint`)

### Следующий рекомендуемый шаг

Внедрить DejaVu Sans TTF для PDF кириллицы, затем добавить UI редактирования профиля компании и списка контрагентов.
