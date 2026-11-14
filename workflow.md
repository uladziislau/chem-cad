# Workflow: миграция chem-cad к эталонной модели Синхроники

> Статус: **в работе**. Норма: `~/Projects/synchronika/specifications/software/`
> (`angular.conventions.md`, `etalon/axes.md`, `etalon/conformance.md`,
> `naming.md`, `package-versions.md`). Проверка: `synchronika/tools/audit/check-structure.ts`.

## 0. Принцип

> Angular — механизм доставки view-слоя, а не проект. Вся логика — чистый
> TypeScript в `domain/` и `modules/`; Angular живёт только в `angular/`.

Целевая корневая структура (норма §1 `angular.conventions.md`):

```
chem-cad/
├── domain/            ← DDD-тактика: entities, values, aggregates (чистый TS)
├── modules/           ← Core-модули: solvers, engine, development data/logic (чистый TS)
├── data/              ← source of truth: JSON + тонкие .ts-обёртки
├── angular/           ← единственный слой, знающий @angular/*
│   ├── main.ts, index.html, app.routes.ts
│   ├── ui/app/        ← корневой компонент + entry page
│   ├── initialization/← app-initializer.service.ts
│   ├── modules/<domain>/  ← feature-модули: ui/pages/, services/, *.routes.ts
│   ├── adapters/<domain>/← порты, InjectionToken, сервисы-адаптеры (§5)
│   ├── services/      ← cross-cutting
│   └── ui/shared/     ← кросс-модульные примитивы (§6)
├── tests/             ← Vitest: unit/, integration/ (зеркало слоёв)
├── documentation/     ← данные О проекте (не импортируется в код)
└── synchronika/       ← (опционально) локальные инструменты аудита
```

Алиасы `tsconfig.json → compilerOptions.paths` (по образцу kulinaria/cad):

| Алиас | Корень | Для чего |
|-------|--------|----------|
| `@domain/*` | `./domain/*` | сущности, VO |
| `@modules/*` | `./angular/modules/*` | Angular feature-модули |
| `@root-modules/*` | `./modules/*` | чистый TS Core |
| `@data/*` | `./data/*` | данные |
| `@adapters/*` | `./angular/adapters/*` | DI-адаптеры |
| `@ui/*` | `./angular/ui/*` | shared-примитивы |

Порядок путей в `paths` важен: специфичные (`@modules/development/data/*`)
идут раньше общих (`@modules/*`).

## 1. Общие правила каждой волны

1. **Один коммит на волну.** Перед волной — `git status` чистый.
2. **Порядок шагов фиксирован.** Шаг N+1 не начинается, пока шаг N не проверен.
3. **Проверка после каждого шага**, где это возможно:
   - `pnpm run typecheck` — зелёный
   - `pnpm run lint` — 0 новых находок
   - `pnpm run test` — зелёный (после волн, трогающих `src/`)
4. **Откат волны** = `git revert <коммит волны>` либо `git reset --hard <prev>`
   до push. Волны не пушатся по одной — пуш после зелёного `check-structure`.
5. **Никаких шимов и реэкспортов-заглушек.** Переезд — это `git mv` + правка
   импортов, а не оставленные `export * from` на старом месте.
6. **Англ. в коде, рус. в доках** — как сейчас.
7. Запрещено в ходе миграции: менять поведение, чинить баги «попутно»,
   переименовывать сущности. Найденный дефект — в отчёт, не в дифф.

## 2. Текущее состояние (снимок 2026-11-14)

- Toolchain: ✅ закрыт (волна 0 прогнана 2026-11-13, rebase `bcf70cd`).
- `check-structure.ts --project .` → **8 нарушений**: нет `angular/main.ts`,
  `angular/app.routes.ts`, `angular/ui/app/app.component.ts`, entry page,
  `angular/initialization/app-initializer.service.ts`, `data/`,
  `angular/adapters/`, `angular/initialization/`.
- `src/core/` (≈4800 строк: entities, domain, solvers, engine,
  thermodynamics, units, testing) и `src/modules/development/` — чистый TS,
  **0 импортов `@angular/*`** (grep).
- `src/app/` — 55 файлов с `@angular`: 30 компонентов, сервисы-адаптеры,
  смешанные `models|data` (чистые) и `features|services` (Angular).
- Development-модуль раздвоён: `src/modules/development/` (model+data) и
  `src/app/modules/development/` (routes+pages+components), роут `/dev`.
- `app.routes.ts` знает только lab-маршруты; dashboard ссылается на
  `/classroom`, `/quantum` — роутов нет (мёртвые ссылки, зафиксировано,
  чинится в волне D).
- `tsconfig.json` — solution-стиль (`files: []` + `references`), это норма
  для chem-cad; `tsconfig.app.json` — `include: ["src/**/*.ts"]`.
- SSR включён (`outputMode: server`, `src/server.ts`, `src/main.server.ts`).

## 3. Волна 0 — agentica/tools (инструменты агента)

Цель: в проекте появляется `agentica/` по канону Synchronika — аудиторы
архитектуры, пробы, рефакторинг-тулы, поиск. Не доменный код, не входит
в Angular-сборку.

### 0.1. Источник

- Универсальный слой (`fix-imports.ts`, `search/*`,
  `configurations/project.json.example`) — канон
  `~/Projects/synchronika/tools/templates/agentica-generic/`,
  синхронизация `bash ~/Projects/synchronika/tools/scripts/agentica/sync-agentica.sh --to .`
- Проектный слой (`core/`, `atomic/`, `composite/`, `probes/`,
  `refactoring/`, `cli.ts`, `about.md`) — копируется из
  `~/Projects/kulinaria/agentica/` как референс-реализация; пути в коде
  отсутствуют — всё читается из `configurations/project.json`.

### 0.2. Шаги

1. `sync-agentica.sh --to .` — универсальный слой.
2. Скопировать из kulinaria: `tools/{core,atomic,composite,probes,refactoring,cli.ts}`.
   В `cli.ts` заменить баннер `KULINARIA` → `CHEM-CAD`.
3. `agentica/tools/configurations/project.json` — под текущую структуру:
   `roots: ["src", "modules", "tests", "agentica"]` на старте; после волны C
   обновить на `["angular", "domain", "modules", "data", "tests", "agentica"]`.
   Алиасы — по мере появления в tsconfig (волна A добавляет `@root-modules` и др.).
4. `agentica/about.md` — адаптировать под chem-cad (раскладка, запуск, аудиторы).
5. `package.json`: devDependency `tsx`, скрипты `audit:arch`, `audit:arch:strict`.
6. `tsconfig.app.json` include += `"agentica/**/*.ts"` (типизация тулов гейтом,
   правило 4 about.md); `tsconfig.spec.json` аналогично.

### 0.3. Проверка волны 0

```bash
npx tsx agentica/tools/cli.ts list
npx tsx agentica/tools/cli.ts audit          # отчёт без падения
pnpm run typecheck                            # agentica типизирован
pnpm run lint                                 # без новых находок
```

Коммит: `chore(agentica): add agentica/tools layer (wave 0)`.

## 4. Волна A — Development-модуль до эталона

Цель: development-раздел соответствует §11 + процедуре
`development-module-migration-etalon`. Самодостаточна, кода приложения не
касается.

### A.1. Чистый TS наверх

```bash
mkdir -p modules
# domain+data уже в src/modules/development — перенести целиком
git mv src/modules/development modules/development
```

- `modules/development/index.ts` — оставить как есть (barrel).
- Проверка: `grep -rn "@angular" modules/` → пусто.

### A.2. Алиасы в tsconfig.json

Добавить в `compilerOptions.paths` (рядом с будущими, сразу все):

```json
"paths": {
  "@root-modules/*": ["./modules/*"],
  "@domain/*": ["./domain/*"],
  "@data/*": ["./data/*"],
  "@adapters/*": ["./angular/adapters/*"],
  "@modules/development/data/*": ["./modules/development/data/*"],
  "@modules/development/*": ["./modules/development/*"],
  "@modules/*": ["./angular/modules/*"],
  "@ui/*": ["./angular/ui/*"]
}
```

- `tsconfig.app.json` → `include: ["src/**/*.ts", "modules/**/*.ts", "domain/**/*.ts"]`
  (solution-стиль сохраняется: корневой `tsconfig.json` не трогаем).
- `tsconfig.spec.json` → `include` += `"modules/**/*.ts"`, `"domain/**/*.ts"`,
  `"tests/**/*.ts"` (запас под волны C).

### A.3. Angular-часть модуля

```bash
mkdir -p angular/modules/development
# pages + components + routes → эталонная раскладка ui/
git mv src/app/modules/development/pages angular/modules/development/ui/pages
git mv src/app/modules/development/components angular/modules/development/ui/components
# development.routes.ts и index.ts — в корень модуля
```

Итог:

```
angular/modules/development/
├── index.ts                  ← barrel: export * from './development.routes' + ui
├── development.routes.ts     ← DEVELOPMENT_ROUTES
└── ui/
    ├── components/development-navigation/…
    └── pages/{development-board,development-specs}/…
```

- В `development.routes.ts` пути `board|specs` сохранить, добавить `title`.
- `index.ts` — реэкспортировать публичный API (компоненты страниц + routes),
  не `export *` на внутренности.
- В компонентах заменить импорт `../../../../../modules/development` на
  `@root-modules/development`.

### A.4. Роутинг приложения

`src/app/app.routes.ts`:

```ts
{
  path: 'development',
  loadChildren: () => import('@modules/development').then(m => m.DEVELOPMENT_ROUTES)
}
```

Путь `dev` → `development` (эталонное имя раздела). Редирект `dev → development`
добавить на один релиз? **Нет** — чистый переезд, старый путь не существовал
в документации как канон; мёртвый путь удаляется.

### A.5. Проверка волны A

```bash
pnpm run typecheck   # зелёный
pnpm run lint        # без новых находок
pnpm run test        # зелёный
bun ~/Projects/synchronika/tools/audit/check-structure.ts --project .  # нарушений не больше 8
```

Коммит: `refactor(development): migrate module to etalon layout (wave A)`.

## 5. Волна B — точка входа в `angular/`

Цель: снять нарушения §10 — entry point живёт в `angular/`.

### B.1. Перенос entry-файлов

```bash
git mv src/main.ts src/index.html src/styles.css src/globals.d.ts angular/
git mv src/main.server.ts src/server.ts angular/
git mv src/app angular/ui/app-bootstrap   # временно, см. B.2
```

Точнее по эталону:

```
angular/
├── main.ts                ← bootstrapApplication(App, appConfig)
├── index.html
├── styles.css
├── main.server.ts
├── server.ts
├── globals.d.ts
├── app.routes.ts          ← бывший src/app/app.routes.ts
├── app.config.ts / app.config.server.ts
└── ui/app/app.component.ts ← бывший src/app/app.ts (App → AppComponent)
```

- `app.ts` переименовать в `app.component.ts`, класс `App` → `AppComponent`,
  селектор `app-root` сохранить.
- `angular.json`: `sourceRoot: ""`, `browser: "angular/main.ts"`,
  `index: "angular/index.html"`, `styles: ["angular/styles.css"]`,
  `server: "angular/main.server.ts"`, `ssr.entry: "angular/server.ts"`,
  `assets` без изменений (`public/`).
- `lint` builder `lintFilePatterns`: `angular/**/*.ts`, `angular/**/*.html`,
  `modules/**/*.ts`, `domain/**/*.ts`, `tests/**/*.ts`.
- `tsconfig.app.json` include: `angular/**/*.ts`, `modules/**`, `domain/**`.

### B.2. app.routes.ts и сервисы

- `app.routes.ts` → `angular/app.routes.ts`; импорты доменов — через алиасы
  `@modules/<domain>` (когда домены появятся в `angular/modules/` на волне D;
  до того — относительные пути, свернуть в B.3 при волне D).
- `app.config.ts` → `angular/app.config.ts`; провайдеры без изменений.
- `app.config.server.ts`, `app.routes.server.ts` → `angular/`.
- `src/app/core/layout/navbar/` → `angular/ui/shell/navbar/` (shell — §6)
  либо `angular/modules/shell/`; решить по факту связей: если navbar —
  cross-cutting, то `angular/ui/shared/navbar/`.

### B.3. Проверка волны B

```bash
pnpm run build     # ng build зелёный (SSR!
)
pnpm run typecheck && pnpm run lint && pnpm run test
curl -s localhost:4000 | head   # SSR отдаёт страницу (serve + server.ts)
```

Коммит: `refactor(entry): move bootstrap to angular/ (wave B)`.

## 6. Волна C — чистый TS наверх

Цель: `domain/`, `modules/`, `data/`, `tests/` в корне; `src/` исчезает.

### C.1. Раскладка src/core

`src/core/` — смешанный: `entities/`, `domain/` → `domain/`;
`solvers/`, `engine/`, `thermodynamics/`, `units/`, `testing/` → `modules/`.

```
domain/
├── entities/      ← src/core/entities/*
├── aspects/       ← src/core/domain/aspects/*
├── services/      ← src/core/domain/services/* (чистые доменные сервисы)
└── values/        ← src/core/domain/values/*
modules/
├── chemistry/     ← src/core/solvers/* (по смыслу — модуль солверов)
├── engine/        ← src/core/engine/*
├── thermodynamics/← src/core/thermodynamics/*
├── units/         ← src/core/units/*
├── development/   ← уже на месте (волна A)
└── testing/       ← src/core/testing/*
```

- Граница `domain/` vs `modules/`: **сущности и значения → domain/;
  алгоритмы и сервисы-оркестраторы → modules/**. Если граница для файла
  неочевидна — файл идёт в `modules/`, в domain/ только то, что является
  сущностью/VO/агрегатом.
- Каждый переезд: `git mv` + глобальная замена импортов
  (`../core/…` → `@domain/…` или `@root-modules/…`).
- `src/core/index.ts` распустить: barrel'ы на новых местах, старый удалить.

### C.2. Доменная логика из src/app

Чистые файлы из `src/app/domains/*/`:

| Откуда | Куда |
|--------|------|
| `*/models/*.ts`, `*.interface.ts`, `*.const.ts` | `modules/<domain>/models/` |
| `*/data/*.mock.ts` | `data/<domain>/*.json` + `modules/<domain>/data/` обёртка |
| `*/calculators/*`, `features/*/*.physics.ts|scene.ts|colors.ts` (чистые) | `modules/<domain>/` соответствующая папка |
| `oop-sandbox.*-demos.ts` (чистые данные) | `modules/architecture/demos/` |

- Домены: `architecture, classroom, formulation, laboratory, quantum,
  recipe, thermodynamics, simulator, advanced, safety, lab, shared`.
- `shared/services/autarky.service.ts` — если чистый → `modules/shared/`;
  если Angular → остаётся до волны D.
- После переноса каждого домена: удалить опустевшие `src/app/domains/<d>/`.

### C.3. Тесты и данные

```bash
git mv src/tests tests
mkdir -p data
# моки → JSON: data/<domain>/<name>.json + .ts-обёртка с типом
```

- `tests/` структура сохранить (`unit/`, `integration/`), поправить
  относительные импорты (`../../core/…` → `@domain/…`/`@root-modules/…`).
- `vitest`/`angular.json test` — проверить, что include-пути покрывают
  `tests/**/*.spec.ts` (эталон §15.2: типизация спек обязательна).
- `data/`: каждый `.mock.ts` → `.json` + тонкий `*.data.ts` с `as const`
  или zod-валидацией по `data/schema/` (если уже есть — сохранить).

### C.4. Проверка волны C

```bash
pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
test ! -d src && echo "src/ удалён"
```

Коммит: `refactor(core): lift pure TS to domain/modules/data/tests (wave C)`.

## 7. Волна D — Angular-слой до конца

Цель: `angular/` содержит весь view-слой; `src/` не существует.

### D.1. Доменные feature-модули

`src/app/domains/<d>/` остаток (components, services) →
`angular/modules/<d>/`:

```
angular/modules/<domain>/
├── index.ts
├── <domain>.routes.ts
├── ui/pages/…        ← features/*/ *.component.ts → ui/pages/<feature>/
├── ui/components/…   ← переиспользуемые внутри модуля
├── ui/widgets/…
├── services/         ← Angular-сервисы домена (бывшие *.service.ts)
└── guards/           ← если есть
```

- Сервисы с `@Injectable`, `signal`, `HttpClient` — в
  `angular/modules/<d>/services/` **или** в `angular/adapters/<d>/`, если
  они реализуют порт для чистого `modules/<d>/` (§5: адаптер не содержит
  бизнес-логики).
- Кросс-модульные UI-примитивы → `angular/ui/shared/`; shell (navbar) →
  `angular/ui/shell/`.

### D.2. Роутинг

- `angular/app.routes.ts` — все доменные маршруты через
  `loadChildren: () => import('@modules/<domain>')`.
- Мёртвые ссылки dashboard (`/classroom`, `/quantum`) — либо роуты
  появляются, либо ссылки удаляются. **Решение фиксируется в коммите**;
  по умолчанию — добавить роуты, если компоненты существуют.
- Имена страниц: `<feature>.<role>.component.ts` → по §7 naming
  (`*.page.component.ts` для routed page).

### D.3. Инициализация

- `angular/initialization/app-initializer.service.ts` — если bootstrap
  грузит данные (сейчас не грузит — тогда каталог создаётся с сервисом
  по факту потребности; норма требует точку, не фиктивный код).
- `APP_INITIALIZER` в `app.config.ts` — только если есть что инициализировать.

### D.4. Финальная проверка

```bash
pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
bun ~/Projects/synchronika/tools/audit/check-structure.ts --project .   # 0 нарушений
find . -name "*.ts" -path "./src/*" | wc -l   # 0
```

Коммит: `refactor(angular): complete etalon layout (wave D)`.

## 8. Пост-миграция

1. Обновить `AGENTS.md`: структура, команды (добавить `pnpm run ci` если
   появится), алиасы.
2. Обновить `conformance.md` в Синхронике: chem-cad → ✅ по структуре,
   дата замера, примечание о волнах A–D.
3. Запись в `synchronika/specifications/DECISIONS.md` — если волны
   изменили трактовку нормы (например, граничный случай domain/modules).
4. Push одной серией после зелёного check-structure.

## 9. Риски и ловушки (по observations.md эталона)

- **tsconfig include vs references**: chem-cad — solution-стиль,
  `include` живёт в `tsconfig.app.json`/`tsconfig.spec.json`, корневой
  `files: []` + `references` НЕ трогать. `tsc --noEmit` без `-p` проверяет
  0 файлов — typecheck-скрипт уже указывает `-p tsconfig.app.json` ✅.
- **SSR**: `server.ts` использует `import.meta.dirname` для `browserDistFolder`
  — при переезде в `angular/` путь `../browser` остаётся верным
  (output `dist/app/browser`), проверить сборкой.
- **Алиасы и Vite**: `paths` из tsconfig подхватываются `@angular/build`
  автоматически (moduleResolution bundler); проверить первой волной,
  где алиас реально используется (A.3).
- **Относительные импорты**: глубина `../../../../../` — после переездов
  часть сломается; чинить алиасами, а не подсчётом `../`.
- **Mock-данные в коде**: `*.mock.ts` импортируются сервисами — при
  переводе в `data/*.json` импорты станут `import data from '@data/…json'`
  (resolveJsonModule) или через `.data.ts`-обёртку. Способ выбрать на
  волне C по факту; JSON-импорт предпочтителен (норма §9).
