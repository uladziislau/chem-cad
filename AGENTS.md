# AGENTS.md

## Команды

```bash
pnpm install          # зависимости
  dev: cross-env ng serve --port=4307 --host=0.0.0.0 --define="GEMINI_API_KEY=\'${GEMINI_API_KEY}\'" ${DISABLE_HMR:+--live-reload=false}
  build: ng build
  test: ng test
  lint: pnpm run lint:ts && pnpm run lint:html
  typecheck: tsc --noEmit
```

## Структура

Слои в корне: src

## Линтер

oxlint (TypeScript/JavaScript) + angular-eslint (шаблоны).

## Форм-факторы

**Single-shell by design** — desktop-first инструмент, мобильный UI не планируется.
Один responsive shell, разделение `ui/desktop`/`ui/mobile` и `resolveDeviceKind()`
не требуются (норма: synchronika `angular.conventions.md` §6).
