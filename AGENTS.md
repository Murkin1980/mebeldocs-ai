# AGENTS

## Перед работой

1. Прочитать `PRODUCT.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `SECURITY.md` и `SESSION_NOTES.md`.
2. Проверить текущий этап и критерий готовности.
3. Не читать весь `data/raw` без необходимости; выбирать ограниченный набор.
4. Не выводить реквизиты и персональные данные в логи/ответы.

## Правила реализации

- Сначала shape, затем craft, затем polish.
- Денежные значения — Decimal/целые тиыны, не float.
- ИИ возвращает схему и уверенность; бизнес-правила работают отдельно.
- Любое необратимое или внешнее действие требует подтверждения.
- Реальные данные и секреты никогда не коммитятся.
- Изменения налоговой логики сопровождаются источником и датой действия.
- После этапа обновить `ROADMAP.md` и `SESSION_NOTES.md`.

## Проверка

- Тесты арифметики, нумерации, прав доступа и изоляции обязательны.
- Документы проверяются по данным и визуальному рендеру.
- Песочница не должна иметь путь к реальной отправке.
## Shared unfinished-project deployment ritual

This repository is still under active development. Before every substantial change, read this file and the project README/session notes, check `git status`, preserve unrelated changes, and identify the exact build and deployment target.

Before claiming completion: run the project lint/typecheck/tests and a production build; commit and push the exact tested state; deploy only from a clean checkout; smoke-test the real public URL and the main user journey on desktop and mobile. A screenshot or local preview alone is not proof of a successful deployment.

For Cloudflare/OpenNext projects: prefer the adapter-supported production builder; if `Failed to load chunk server/chunks/ssr/...` occurs, check current OpenNext troubleshooting and use a Webpack build when recommended. Avoid deploying from OneDrive or paths with Cyrillic/spaces when artifacts behave inconsistently; use a clean ASCII-only clone under `C:\tmp`. After DNS/custom-domain creation, distinguish stale local `NXDOMAIN` cache from a server failure by checking a public resolver, direct HTTPS status, Worker logs, and then a fresh browser process.

Never weaken database authorization to make missing data appear. For OAuth migrations, verify user IDs, organization membership, ownership fields, RLS, storage access, and record counts. Never print or commit secrets.