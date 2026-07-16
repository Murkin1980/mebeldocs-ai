# MebelDocs AI — инструкция для эксперимента в Google Stitch

Дата актуализации: 16.07.2026.

## Цель

Создать альтернативный дизайн одного экрана MebelDocs AI: проверка данных после загрузки бухгалтерского ZIP-архива. Это не лендинг, а рабочий интерфейс владельца мебельного ИП Казахстана.

Google Stitch умеет принимать описание, изображения и код как контекст, поддерживает итерации на холсте и перенос дизайн-правил через `DESIGN.md`. Поэтому сначала создайте один экран, затем улучшайте его короткими запросами, не просите сразу весь SaaS.

Официальные материалы:

- https://stitch.withgoogle.com/
- https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/
- https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-design-md/

## Что подготовить

1. Откройте текущий прототип MebelDocs AI или сделайте его скриншот.
2. Подготовьте этот файл и корневой `DESIGN.md` проекта.
3. Не загружайте реальные счета, БИН/ИИН, банковские реквизиты, подпись, печать или архив ИП.
4. Используйте только вымышленные сведения из промпта ниже.

## Основной промпт для Stitch

Скопируйте весь блок одним сообщением:

```text
Design a high-fidelity responsive web application screen for “MebelDocs AI”, a calm and trustworthy document workflow assistant for small furniture businesses in Kazakhstan.

This is an operational B2B SaaS interface, not a marketing landing page. The user is a furniture workshop owner who has uploaded a ZIP archive with invoices, contracts, closing documents, ESF records and bank statements. The system has analyzed the archive but must never change accounting data without confirmation.

Create one desktop screen at 1440×1000 named “Archive review / Confirmation”, plus a mobile adaptation at 390×844.

Layout:
- dark forest-green left navigation with MebelDocs AI logo, demo company switcher, Today, Create, Orders, Documents, Counterparties, Calendar, Settings and user profile;
- a permanent pale-yellow sandbox banner at the top saying “ПЕСОЧНИЦА — ничего не отправляется”;
- central workspace with title “Проверьте найденные данные” and subtitle explaining that originals remain unchanged;
- four-step progress: Загрузка, Проверка, Извлечение, Подтверждение;
- four summary cards: “Готово к импорту — 249”, “Нужно подтвердить — 14”, “Возможные ошибки — 5”, “Не удалось прочитать — 3”;
- main review card asking “Это версии одного документа?”;
- side-by-side comparison of an editable XLSX invoice and a stamped PDF invoice. Both use fictional data: Счёт №32 от 05.05.2026, 590 000 ₸, ТОО «Демо Мебель»;
- show source links, file type, modified time and an 86% confidence badge;
- an AI explanation box: number, date, amount and counterparty match; PDF was created 9 minutes after Excel and contains a stamp;
- actions: “Это разные документы” and primary “Да, объединить как версии”;
- sticky bottom confirmation area saying that only confirmed records will be imported;
- permanent AI assistant panel on desktop and full-screen assistant on mobile. It explains the current suggestion, cites two sources and offers quick questions.

Visual direction:
- restrained, warm and professional; trustworthy accounting product without looking like a bank;
- forest green, soft mint, warm ivory, muted amber for warnings, restrained red only for errors;
- generous white space, 10–14 px radii, subtle borders, very light shadows;
- Manrope or a similar highly readable sans-serif;
- compact information density suitable for everyday work;
- use real Russian interface copy, never lorem ipsum;
- meet WCAG AA contrast, visible keyboard focus, 44 px mobile touch targets;
- do not use gradients, glassmorphism, neon colors, stock photos, decorative charts or excessive cards.

Safety must be visually obvious:
- sandbox and real company modes must never be confused;
- no “Send”, “Sign” or external submission action on this screen;
- show that AI suggestions require user confirmation;
- distinguish fact from source, system inference and user decision.

Generate a coherent product-quality screen and reusable components, not an illustration. Keep all sample identities fictional.
```

## Последовательность улучшений

После первой генерации отправляйте запросы по одному.

### Итерация 1 — информационная иерархия

```text
Improve the information hierarchy. The document comparison and required user decision must dominate the screen. Reduce decorative elements, keep summary cards compact, and make the next safe action obvious without making it alarming.
```

### Итерация 2 — AI-помощник

```text
Refine the AI assistant panel as a workflow assistant, not a generic chatbot. Show current task, evidence citations, confidence, quick questions and a clear boundary between explanation and accounting action. Keep the panel useful but visually secondary to the review decision.
```

### Итерация 3 — мобильный экран

```text
Create the mobile version at 390×844. Replace the sidebar with a compact header and bottom navigation. Stack the compared files vertically. Keep the confirmation action sticky above the safe area. Open the AI assistant as a full-screen sheet. Preserve all safety labels.
```

### Итерация 4 — состояния

```text
Create component states for: loading, source preview open, accepted as versions, marked as separate documents, low confidence, unreadable file, empty archive and import completed. Do not create new pages; arrange the states beside the main screen on the canvas.
```

### Итерация 5 — дизайн-система

```text
Extract a compact design system from the approved screen: color tokens, typography, spacing, radii, shadows, buttons, badges, status cards, document cards, source citations, assistant messages and responsive behavior. Keep names suitable for implementation in React and CSS variables.
```

## Что экспортировать

Сохраните из Stitch:

1. ссылку на проект;
2. PNG основного desktop-экрана;
3. PNG мобильного экрана;
4. экспортированный `DESIGN.md`, если доступен;
5. HTML/CSS или другой предлагаемый код;
6. краткое описание варианта, который понравился больше всего.

Передайте эти материалы обратно в проект. Код Stitch рассматривается как дизайн-черновик: бизнес-логику, доступность, адаптивность, безопасность и качество кода нужно проверить до объединения.

## Чек-лист результата

- [ ] Пользователь за 5 секунд понимает, что требуется подтвердить.
- [ ] Видно, почему система связала два файла.
- [ ] Источники доступны рядом с выводом.
- [ ] AI не выглядит как сторона, самостоятельно принимающая решение.
- [ ] Песочницу невозможно спутать с реальным режимом.
- [ ] Нет реальных реквизитов или документов.
- [ ] Основное действие понятно и не провоцирует случайное подтверждение.
- [ ] Экран работает при ширине 390 px без горизонтальной прокрутки.
- [ ] Цвет — не единственный способ различать статусы.
- [ ] Компоненты можно перенести в текущий Next.js-прототип.
