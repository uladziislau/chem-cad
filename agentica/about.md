# Агентика (agentica)

Инструменты для агентов, работающих с этой кодовой базой: аудит архитектуры,
быстрый поиск, массовые правки по регулярным выражениям. Это не доменный код
и не тесты — слой живёт рядом с гейтами, не входит в Angular-сборку и не
дублирует oxlint: линтер смотрит синтаксис и размеры, агентика — связи.

## Раскладка

```
agentica/
├── tools/
│   ├── core/            paths (корни, алиасы из configurations), audit-контракт,
│   │                    resolve (спецификатор → файл)
│   ├── atomic/          аудиторы: один срез здоровья → находки
│   ├── composite/audit.ts   реестр аудиторов + сводный отчёт и индекс здоровья
│   ├── probes/          диагностика без вердикта: dep-graph, modules, routes
│   ├── refactoring/     правки по регулярным выражениям + rename-file + onpush
│   ├── search/          ripgrep-обёртка и CLI поиска (канон Synchronika)
│   ├── fix-imports.ts   снятие расширения .ts из импортов (канон Synchronika)
│   ├── cli.ts           единая точка входа: list, audit, probe
│   └── configurations/project.json   roots, extensions, skipDirs, aliases
└── about.md
```

`configurations/project.json` — единственное место с путями: `roots` (что
сканировать), `extensions`, `skipDirs`, `aliases`. Инструменты читают его при
запуске; абсолютных путей проекта в коде нет.

`search/`, `fix-imports.ts` — универсальные: их источник истины
`~/Projects/synchronika/tools/templates/agentica-generic/`, синхронизация
`bash ~/Projects/synchronika/tools/scripts/agentica/sync-agentica.sh --to .`
(не затирает `configurations/`). Правки этих файлов делать в каноне,
не здесь.

## Запуск

```bash
pnpm audit:arch               # сводка: critical + warning, индекс здоровья
pnpm audit:arch:strict        # то же, но exit 1 при critical (для CI)
# имя `pnpm audit` занято встроенной проверкой уязвимостей — поэтому :arch
npx tsx agentica/tools/cli.ts list
npx tsx agentica/tools/cli.ts audit --only=circular-deps --verbose
npx tsx agentica/tools/cli.ts probe dep-graph     # граф контекстов + mermaid
npx tsx agentica/tools/cli.ts probe modules       # инвентарь модулей
npx tsx agentica/tools/cli.ts probe routes        # маршруты → файлы

# рефакторинг: по умолчанию только показ, --write применяет
npx tsx agentica/tools/refactoring/transform.cli.ts replace \
  --pattern="oldName" --replace="newName" --path=angular/modules/x
npx tsx agentica/tools/refactoring/transform.cli.ts rename-file \
  --from=angular/modules/x/a.ts --to=angular/modules/x/b.ts --write
npx tsx agentica/tools/refactoring/transform.cli.ts onpush --path=angular

# поиск
npx tsx agentica/tools/search/search.cli.ts "<pattern>" --count
```

## Аудиторы

| id | Что проверяет |
|---|---|
| `circular-deps` | циклы между контекстами `angular/modules` + минимальный набор рёбер для разрыва |
| `dead-files` | достижимость файлов от точек входа (main, routes, server, tests) |
| `dead-paths` | алиасы и `include` в tsconfig, ведущие в несуществующее |
| `component-strategy` | `ChangeDetectionStrategy.OnPush` в компонентах |
| `file-naming` | роль файла против объявленного декоратора |
| `import-depth` | относительные импорты на 3+ уровня вместо алиасов |
| `type-safety` | карта `any` по файлам и формам записи |
| `data-pairs` | `.data.ts` → JSON: пара существует и разбирается |
| `empty-dirs` | каталоги без файлов |

Аудиторы дают находки и **ничего не правят**: вердикт (отчёт, CI, автофикс)
принимает вызывающий. Файлы в `tests/`, `*.spec.ts`, `*.test.ts` и сам
`agentica/` из проверок исключены — у фикстур нет рантайм-цены.

## Правила

1. **Dry-run — состояние по умолчанию.** Запись только с `--write`. Одиночная
   регулярка без просмотра правит чужие места: правило должно быть узким
   (конкретный идентификатор, конкретный синтаксис), а не `\w+`.
2. **Переезд файла — только `rename-file`.** Он строит формы спецификатора на
   каждый файл (относительный путь у каждого свой) и меняет код и файл одной
   операцией; ручной `git mv` оставляет битые импорты.
3. **Один резолвер.** `core/resolve.ts` разрешает спецификатор в файл для
   циклов, достижимости и правки импортов — чтобы инструменты не расходились
   в понимании графа.
4. **Типы проверяются гейтом.** `agentica/**/*` включён в `tsconfig.json`:
   `pnpm typecheck` ловит ошибки инструментов наравне с доменом.
5. **Новый аудитор — строка в `composite/audit.ts`.** Реестр один: CLI и
   сводка читают его, регистрации в двух местах нет.
