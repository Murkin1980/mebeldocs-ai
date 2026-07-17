# MebelDocs AI — следующие экраны для Google Stitch

Дата: 18.07.2026. Использовать после создания `[Design_System]` и `[Components]`.

## Сколько экранов нужно

До закрытого пилота на ИП необходимо спроектировать ещё 6 основных экранов:

1. Журнал проверки и решений.
2. Создание счёта через AI.
3. Предпросмотр и подтверждение документа.
4. Карточка продажи и комплект закрывающих документов.
5. Контрагенты и номенклатура.
6. Календарь обязательств и сроков ЭСФ.

Дополнительно до подключения нового мебельщика нужен 7-й сценарий — onboarding через ZIP. Его проектируем после проверки основного документооборота на ИП «Гранд Мебель».

Не просите Stitch сделать все экраны одним запросом. Создавайте по одному экрану в указанном порядке, проверяйте desktop/mobile, затем переходите к следующему.

## Общий префикс для каждого запроса

Добавляйте этот блок в начало каждого промпта:

```text
Use the existing [Design_System] and [Components] for MebelDocs AI. Do not create a competing visual system. This is a production B2B accounting workflow for small furniture businesses in Kazakhstan, not a marketing page.

Use Russian interface copy and fictional data only. Never show real BIN/IIN, IBAN, addresses, signatures, stamps or accounting documents. AI may propose and explain, but legally meaningful actions require explicit user confirmation. Preserve the permanent sandbox indicator in all experimental screens.

Create desktop at 1440×1000 and mobile at 390×844. Meet WCAG AA contrast, visible keyboard focus and 44 px mobile touch targets. Reuse existing navigation, status, button, source citation, document card and AI assistant components.
```

---

## Экран 1 — Журнал проверки и решений

Это следующий экран, который нужно создать сейчас.

```text
Create the “Журнал проверки” screen for MebelDocs AI.

Purpose: allow the owner to move through every archive-review task and see an immutable history of previous decisions.

Include:
- page title “Журнал проверки” with counters: 14 waiting, 3 completed, 2 deferred;
- filter tabs: Все, Нужно решение, Ошибки, Завершено, Отложено;
- filters for task type, date, confidence and counterparty;
- task list with type, short explanation, confidence, source count, status and last action;
- selected task detail pane with evidence and source citations;
- chronological audit timeline showing actor, time, old decision and new decision;
- actions: подтвердить, оставить как есть, отложить, изменить решение;
- a warning that changing a decision creates a new event and never deletes the previous one;
- Previous / Next task navigation and keyboard shortcuts;
- permanent AI assistant that explains the selected task but cannot confirm it.

Use fictional tasks: document versions, ESF link, payment match and company profile. Make the task queue efficient for reviewing 20–50 items, not a card gallery.

Create states: empty filters, loading, save error, decision saved, decision changed, and read-only audit event.
```

Файлы экспорта:

- `review-journal-desktop-v01.png`
- `review-journal-mobile-v01.png`
- `review-journal-states-v01.png`

---

## Экран 2 — Создание счёта через AI

```text
Create the “Создать счёт” screen for MebelDocs AI.

The main entry is a natural-language command such as: “Создай счёт для ТОО Демо Интерьер: шкаф архивный, 2 штуки по 180 000 тенге, без НДС”.

Include:
- large text/voice command input;
- selected company and document type;
- AI extraction result with confidence per field;
- counterparty autocomplete with source and duplicate warning;
- editable line items: type goods/service, name, unit, quantity, price, discount, tax and total;
- deterministic arithmetic summary;
- contract selector with “Без договора” option;
- payment terms and due date;
- separate controls for adding stamp/signature only to the final approved copy;
- visible validation for missing BIN, duplicate number, mixed goods/services and inconsistent totals;
- actions: Сохранить черновик and Проверить документ;
- AI assistant showing what it understood and asking only for missing information.

Use fictional data. Clearly distinguish AI-extracted values from confirmed values. Do not include a direct external send action.

Create states: empty, AI parsing, missing counterparty, validation errors, draft saved and offline/error.
```

Файлы:

- `create-invoice-desktop-v01.png`
- `create-invoice-mobile-v01.png`
- `create-invoice-states-v01.png`

---

## Экран 3 — Предпросмотр и подтверждение документа

```text
Create the “Проверка документа” screen shown after an invoice draft is prepared.

Include:
- A4 document preview as the main focus;
- structured validation checklist beside it;
- document number, date, counterparty, contract, line totals, VAT status and amount in words;
- toggles for version without stamp and approved copy with stamp/signature;
- clear fact/source/inference labels;
- warnings rendered next to the affected field and highlighted in the preview;
- version history and source command;
- actions: Вернуться к редактированию, Сохранить PDF, Подтвердить документ;
- no Send or Sign with EDS action in the pilot;
- AI assistant explaining validation findings with citations.

Create states: valid, warning, blocking error, PDF generation, confirmed and corrected version.
```

Файлы:

- `document-review-desktop-v01.png`
- `document-review-mobile-v01.png`
- `document-review-states-v01.png`

---

## Экран 4 — Продажа и закрывающие документы

```text
Create the “Продажа и закрывающие документы” screen.

Purpose: track one business operation from invoice through payment, fulfillment, Z-2/R-1 and ESF obligation.

Include:
- operation header with status, counterparty, amount and responsible owner;
- timeline: Счёт → Оплата → Реализация → З-2/Р-1 → ЭСФ;
- invoice and payment matching, including partial payment progress;
- line items separated into goods and services;
- automatic proposal: goods create Z-2, services create R-1;
- contract and power-of-attorney status;
- closing-document cards with draft/confirmed/sent/accepted statuses;
- ESF obligation card with event date, calculated deadline, legal-rule source and reminders;
- actions only for preparing drafts; signing and external submission remain disabled in sandbox;
- complete audit timeline.

Create states: unpaid, partially paid, paid, mixed goods/services, documents missing, ready to close, overdue ESF and reversed sale.
```

Файлы:

- `sale-closing-desktop-v01.png`
- `sale-closing-mobile-v01.png`
- `sale-closing-states-v01.png`

---

## Экран 5 — Контрагенты и номенклатура

```text
Create a master-data workspace for “Контрагенты и номенклатура”.

Use two coordinated views or tabs within one product area.

Counterparties:
- searchable data table;
- legal name, BIN/IIN masked in sandbox, role, contracts, open invoices and data-quality status;
- duplicate suggestions and conflicting values;
- detail drawer with sources and confirmed fields.

Nomenclature:
- furniture goods and services table;
- normalized name, original variants, type goods/service, unit, default price and usage count;
- examples: шкаф, кухонный шкаф, стол, монтаж, доставка;
- merge duplicates and preserve aliases;
- bulk confirmation with an undoable preview, never silent bulk editing.

Include AI suggestions with confidence, source citations and explicit user confirmation. Optimize for hundreds of rows with filters and batch selection.
```

Файлы:

- `master-data-desktop-v01.png`
- `master-data-mobile-v01.png`
- `master-data-states-v01.png`

---

## Экран 6 — Календарь и сроки ЭСФ

```text
Create the “Календарь обязательств” screen for MebelDocs AI.

Include:
- Today / Week / Month views;
- summary: due today, next 3 days, overdue and blocked by missing data;
- obligation list grouped by date;
- ESF task showing confirmed event date, deadline, remaining days and rule source;
- closing-document and payment-follow-up tasks;
- filters by counterparty, obligation type, status and responsible user;
- task detail with related invoice, sale, Z-2/R-1 and ESF;
- reminders at 7/3/1 days and due date;
- explicit “date needs confirmation” state when the legal event is ambiguous;
- no automatic external ESF submission;
- AI assistant explains why a deadline was calculated and distinguishes law from system inference.

Create states: normal, upcoming, due today, overdue, blocked, completed and rule updated.
```

Файлы:

- `obligations-calendar-desktop-v01.png`
- `obligations-calendar-mobile-v01.png`
- `obligations-calendar-states-v01.png`

---

## Экран 7 — Onboarding нового мебельщика через ZIP

Делать после первых шести экранов и теста собственного документооборота.

```text
Create a guided onboarding flow for a new furniture business importing its accounting archive into MebelDocs AI.

Design these steps on one Stitch canvas:
1. welcome and safety guarantees;
2. choose archive or empty company;
3. Windows/macOS/mobile instructions for preparing a ZIP;
4. upload and quarantine scan progress;
5. inventory results in four groups;
6. entity confirmation;
7. import summary and first AI command.

Clearly explain what to include and what never to upload: EDS password, banking password, API keys and unrelated personal documents. Show zip-slip, zip-bomb and executable-file checks in plain language, not technical logs. Originals remain unchanged. Every extracted field has source and confidence.

Create desktop and mobile flow plus unsafe archive, duplicate archive, interrupted upload and cancel/delete states.
```

Файлы:

- `onboarding-flow-desktop-v01.png`
- `onboarding-flow-mobile-v01.png`
- `onboarding-states-v01.png`

## Куда сохранять результаты

```text
design/stitch/screens/       все версии PNG/WebP
design/stitch/code-export/   исходный экспорт кода Stitch
design/stitch/approved/      только выбранный desktop/mobile вариант
design/stitch/source/        ссылка на Stitch и DESIGN.stitch.vNN.md
```

В `apps/web` ничего не переносить напрямую. После каждого экрана передайте мне ссылку Stitch, desktop PNG, mobile PNG и code export. Я сравню варианты, проверю доступность и перенесу выбранные компоненты в рабочий Next.js-код.

## Очередь работы

- [ ] Экран 1 — Журнал проверки.
- [ ] Экран 2 — Создание счёта.
- [ ] Экран 3 — Проверка документа.
- [ ] Экран 4 — Продажа и закрывающие.
- [ ] Экран 5 — Контрагенты и номенклатура.
- [ ] Экран 6 — Календарь обязательств.
- [ ] Экран 7 — Onboarding ZIP после внутреннего пилота.
