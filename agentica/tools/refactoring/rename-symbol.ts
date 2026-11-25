import './lib/preflight';
import type ts from 'typescript';
import { parseArgs, requireValue, fail, printChange } from './lib/cli';
import { openProject } from './lib/open';
import { resolvePosition } from './lib/position';

const HELP = `
Переименование символа по всему проекту (TypeScript Language Service).

Использование:
  bun agentica/tools/refactoring/rename-symbol.ts --file <path> --symbol <name> --new-name <name> [--dry-run]
  bun agentica/tools/refactoring/rename-symbol.ts --file <path> --line 12 --col 5 --new-name <name>

Опции:
  --file <path>        Файл, где объявлен символ (обязательно)
  --symbol <name>      Имя символа; берётся объявление в этом файле
  --line, --col        Точная позиция (1-based), если имя неоднозначно
  --new-name <name>    Новое имя (обязательно)
  --first              Взять первое объявление, если имён несколько
  --write              Применить изменения (по умолчанию только показывает)
  --root <dir>         Корень проекта (по умолчанию вверх от cwd)
  --tsconfig <path>    Явный tsconfig.json

Пример:
  bun agentica/tools/refactoring/rename-symbol.ts --file angular/app/services/user.service.ts --symbol UserService --new-name AccountService
`;

const args = parseArgs(process.argv.slice(2));
if (args.flags.has('--help') || args.flags.has('-h')) {
  console.log(HELP.trim());
  process.exit(0);
}

const newName = requireValue(args, '--new-name');
const write = args.flags.has('--write');

if (!/^[A-Za-z_$][\w$]*$/.test(newName)) fail(`Недопустимое имя: ${newName}`);

const project = openProject(args);
const { file, position } = resolvePosition(project, args);

const info = project.service.getRenameInfo(file, position, { allowRenameOfImportPath: false });
if (!info.canRename) fail(`Переименование невозможно: ${info.localizedErrorMessage ?? 'причина не указана'}`);

const locations = project.service.findRenameLocations(file, position, false, false) ?? [];
if (!locations.length) fail('Ссылок не найдено');

const byFile = new Map<string, ts.TextChange[]>();
let skipped = 0;

for (const location of locations) {
  if (location.fileName.includes('/node_modules/')) {
    skipped++;
    continue;
  }
  const changes = byFile.get(location.fileName) ?? [];
  changes.push({
    span: location.textSpan,
    newText: `${location.prefixText ?? ''}${newName}${location.suffixText ?? ''}`,
  });
  byFile.set(location.fileName, changes);
}

for (const [fileName, changes] of byFile) project.applyTextChanges(fileName, changes);

const changed = write ? project.save() : project.changedFiles;

console.log(`Символ: ${info.displayName} → ${newName}`);
console.log(`Файлов затронуто: ${changed.length}, вхождений: ${locations.length - skipped}`);
if (skipped) console.log(`Пропущено в node_modules: ${skipped}`);
for (const change of changed) printChange(project.relative(change.file), change.before, change.after);

if (write) {
  console.log('✅ Готово. Проверь: bunx tsc --noEmit');
} else {
  console.log('Предпросмотр. Применить: --write');
}
