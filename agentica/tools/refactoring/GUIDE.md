# Рефакторинг через AST (канон Synchronika)

Структурные правки кода делаются через дерево разбора, а не регулярными выражениями.
Регулярка видит текст, AST видит структуру: имена, области видимости, импорты, типы.

## Правило

| Задача | Инструмент |
|---|---|
| Переименовать символ, найти ссылки, перенести файл | `refactoring/*` (этот каталог) |
| Массовая миграция, кодмод, кастомное преобразование | `ts-morph` (см. ниже) |
| Точечная механическая замена в одном месте | `sed`/`edit` допустимы |
| Правка структуры регуляркой | запрещено |

Регулярка ломается на вложенности, форматировании, строках и комментариях. Если правка
зависит от того, «что это за узел», это работа для AST.

## Инструменты

Все инструменты по умолчанию **ничего не пишут**: сначала показывают план, применяют по `--write`.

```bash
# Переименовать символ во всём проекте (с учётом типов, не трогает строки и комментарии)
bun agentica/tools/refactoring/rename-symbol.ts \
  --file angular/app/services/user.service.ts --symbol UserService --new-name AccountService --write

# Все ссылки на символ
bun agentica/tools/refactoring/find-references.ts \
  --file angular/app/services/user.service.ts --symbol UserService

# Перенести файл и починить импорты
bun agentica/tools/refactoring/move-file.ts \
  --from angular/app/services/user.service.ts \
  --to angular/app/domains/user/services/user.service.ts --write

# Angular: inline template/styles → отдельные .html/.css
bun agentica/tools/refactoring/extract-component-parts.ts --write
bun agentica/tools/refactoring/extract-component-parts.ts --check   # для CI
```

Точная позиция вместо имени: `--line 12 --col 5` (1-based, как в редакторе).

После любой правки: `bunx tsc --noEmit` (или `npm run typecheck`).

## Как это устроено

`lib/project.ts` поднимает `ts.LanguageService` на `tsconfig.json` проекта. Это тот же
движок, что стоит за LSP в редакторе, но внутри процесса: без сервера, без протокола,
без дополнительных зависимостей. Используется `typescript` самого проекта.

- `rename-symbol` → `getRenameInfo` + `findRenameLocations`
- `find-references` → `findReferences`
- `move-file` → `getEditsForFileRename`
- `extract-component-parts` → разбор AST через `createSourceFile`

## Требования и ограничения

- `typescript` 5 или 6 установлен в проекте (`bun install` / `npm ci`); без него инструмент
  сразу скажет, что зависимостей нет.
- Нативный порт **TypeScript 7 не содержит compiler API**
  (`createLanguageService === undefined`), инструменты выйдут с понятной ошибкой.
  В таком проекте используй `ts-morph`.
- Переименование намеренно не трогает строки и комментарии. Если имя встречается в
  строке (например, в ключе локализации), поправь вручную.
- Анализируется только программа из `tsconfig.json`. Файлы вне `include` не видны,
  укажи другой конфиг через `--tsconfig`.
- Angular-шаблоны (`.html`) не анализируются: для них нужен Angular Language Service.

## ts-morph для кастомных кодмодов

Когда готового инструмента не хватает, пиши разовый скрипт на `ts-morph`:

```bash
bun add -d ts-morph
```

```ts
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const source = project.getSourceFileOrThrow('angular/app/services/user.service.ts');
source.getClassOrThrow('UserService').rename('AccountService');
project.saveSync();
```

`ts-morph` даёт удобный API поверх того же компилятора: `rename`, `move`, `addImport`,
`getDescendantsOfKind`, `replaceWithText`. Для разовых миграций это быстрее, чем
писать на голом compiler API.

## Канон и проектная специфика

`GUIDE.md`, `lib/` и четыре инструмента синхронизируются из Synchronika.
Проектные скрипты (миграции, `separate-component-files.ts` и подобные) лежат рядом,
синхронизация их не трогает. `README.md` в этом каталоге принадлежит проекту
и никогда не перезаписывается.
