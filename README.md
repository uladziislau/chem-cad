# ChemCAD — ХимСАПР: Инженерная Среда

Платформа для проектирования полезных химических продуктов и обеспечения технологического суверенитета через самообеспечение.

## Стек

- **Angular 21** + SSR (Express)
- **TypeScript** strict mode
- **pnpm** package manager
- **Vitest** + `ng test` для unit/integration тестов
- **Playwright** для E2E тестов
- **oxlint** + `angular-eslint` для линтинга

## Структура

```
├── domain/          # DDD: entities, values, aspects (чистый TS)
├── modules/         # Core-модули: solvers, engine, units (чистый TS)
├── data/            # Source of truth: данные и моки
├── angular/         # Angular-слой: UI, services, adapters
│   ├── modules/     # Feature-модули (lab, quantum, recipe, ...)
│   ├── ui/          # App shell, entry page
│   ├── adapters/    # DI-мосты и кросс-доменные сервисы
│   └── initialization/ # Bootstrap-сервисы
├── tests/           # Unit и integration тесты (337 тестов)
├── e2e/             # Playwright E2E тесты (58 тестов)
└── agentica/        # Инструментарий аудита и рефакторинга
```

## Команды

```bash
pnpm install          # зависимости
pnpm dev              # dev-сервер на :3000
pnpm build            # production build
pnpm test             # тесты
pnpm lint             # oxlint + angular-eslint
pnpm typecheck        # tsc --noEmit
pnpm test:e2e         # Playwright E2E
pnpm audit:arch       # архитектурный аудит (agentica/tools)
```

## Архитектура

- **Domain layer** (`domain/`): химические сущности, значения, аспекты — чистый TypeScript без Angular
- **Core modules** (`modules/`): решатели (solvers), движок (engine), единицы измерения (units)
- **Angular layer** (`angular/`): UI-компоненты, сервисы, маршрутизация, SSR
- **Data** (`data/`): JSON/TS данные, разделённые по доменам

Подробности: `documentation/architecture/`, `documentation/development/`
