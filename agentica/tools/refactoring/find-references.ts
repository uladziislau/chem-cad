import './lib/preflight';
import fs from 'node:fs';
import ts from 'typescript';
import { parseArgs } from './lib/cli';
import { openProject } from './lib/open';
import { resolvePosition } from './lib/position';

const HELP = `
Поиск всех ссылок на символ (TypeScript Language Service, с учётом типов).

Использование:
  bun agentica/tools/refactoring/find-references.ts --file <path> --symbol <name> [--json]
  bun agentica/tools/refactoring/find-references.ts --file <path> --line 12 --col 5

Опции:
  --file <path>      Файл, где объявлен символ
  --symbol <name>    Имя символа
  --line, --col      Точная позиция (1-based)
  --first            Взять первое объявление, если имён несколько
  --json             Вывод в JSON
  --root <dir>       Корень проекта
  --tsconfig <path>  Явный tsconfig.json
`;

interface Row {
  file: string;
  line: number;
  column: number;
  write: boolean;
  definition: boolean;
  text: string;
}

const args = parseArgs(process.argv.slice(2));
if (args.flags.has('--help') || args.flags.has('-h')) {
  console.log(HELP.trim());
  process.exit(0);
}

const project = openProject(args);
const { file, position } = resolvePosition(project, args);

const groups = project.service.findReferences(file, position) ?? [];
const seen = new Set<string>();
const rows: Row[] = [];

for (const group of groups) {
  for (const reference of group.references) {
    if (reference.fileName.includes('/node_modules/')) continue;
    const key = `${reference.fileName}:${reference.textSpan.start}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const text = fs.existsSync(reference.fileName) ? project.text(reference.fileName) : '';
    const sourceFile = ts.createSourceFile(reference.fileName, text, ts.ScriptTarget.Latest, true);
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(reference.textSpan.start);
    const lineText = text.split('\n')[line] ?? '';

    rows.push({
      file: project.relative(reference.fileName),
      line: line + 1,
      column: character + 1,
      write: reference.isWriteAccess,
      definition: reference.isDefinition ?? false,
      text: lineText.trim(),
    });
  }
}

rows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);

if (args.flags.has('--json')) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  for (const row of rows) {
    const mark = row.definition ? 'def' : row.write ? 'write' : 'read';
    console.log(`${row.file}:${row.line}:${row.column}  [${mark}]  ${row.text}`);
  }
  console.log(`\nВсего ссылок: ${rows.length}`);
}
