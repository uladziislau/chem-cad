import './lib/preflight';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { applyChanges } from './lib/project';
import { parseArgs, requireValue, fail, printChange } from './lib/cli';
import { openProject } from './lib/open';

const HELP = `
Перемещение файла с автоматической починкой импортов (TypeScript Language Service).

Использование:
  bun agentica/tools/refactoring/move-file.ts --from <path> --to <path> [--write]

Опции:
  --from <path>      Откуда (относительно корня проекта)
  --to <path>        Куда
  --write            Применить (по умолчанию только показывает план)
  --force            Перезаписать существующий файл назначения
  --root <dir>       Корень проекта
  --tsconfig <path>  Явный tsconfig.json
`;

const args = parseArgs(process.argv.slice(2));
if (args.flags.has('--help') || args.flags.has('-h')) {
  console.log(HELP.trim());
  process.exit(0);
}

const project = openProject(args);
const from = project.resolve(requireValue(args, '--from'));
const to = project.resolve(requireValue(args, '--to'));
const write = args.flags.has('--write');

if (!fs.existsSync(from)) fail(`Нет файла: ${project.relative(from)}`);
if (from === to) fail('--from и --to совпадают');
if (fs.existsSync(to) && !args.flags.has('--force')) {
  fail(`Цель уже существует: ${project.relative(to)} (добавь --force, чтобы перезаписать)`);
}

const edits = project.service.getEditsForFileRename(from, to, {}, {}) ?? [];

const byFile = new Map<string, ts.TextChange[]>();
for (const edit of edits) {
  const changes = byFile.get(edit.fileName) ?? [];
  changes.push(...edit.textChanges);
  byFile.set(edit.fileName, changes);
}

const movedChanges = byFile.get(from) ?? [];
byFile.delete(from);

for (const [fileName, changes] of byFile) project.applyTextChanges(fileName, changes);

const movedText = applyChanges(fs.readFileSync(from, 'utf8'), movedChanges);
const changed = write ? project.save() : project.changedFiles;

console.log(`Перемещение: ${project.relative(from)} → ${project.relative(to)}`);
if (!edits.length) {
  console.log('⚠️  Файл не входит в программу tsconfig: импорты не будут обновлены, только перенос.');
} else {
  console.log(`Импортов обновлено в ${changed.length} файл(ах)`);
}
for (const change of changed) printChange(project.relative(change.file), change.before, change.after);

if (write) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.writeFileSync(to, movedText, 'utf8');
  fs.rmSync(from);
  console.log('✅ Готово. Проверь: bunx tsc --noEmit');
} else {
  console.log('Предпросмотр. Применить: --write');
}
