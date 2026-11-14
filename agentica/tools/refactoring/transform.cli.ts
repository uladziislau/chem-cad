import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectFiles, projectRoot } from '../core/paths';
import {
  RegexCodeTransformer,
  importPathRulesForFile,
  type RegexTransformRule,
  type TransformSummary,
} from './regex-transformer.tool';

/**
 * CLI рефакторинга по регулярным выражениям.
 *
 * Запуск (из корня проекта):
 *   npx tsx agentica/tools/refactoring/transform.cli.ts replace --pattern="<regex>" --replace="<str>" [--path=angular] [--write]
 *   npx tsx agentica/tools/refactoring/transform.cli.ts rename-file --from=<path> --to=<path> [--write]
 *   npx tsx agentica/tools/refactoring/transform.cli.ts onpush [--path=angular] [--write]
 *   npx tsx agentica/tools/refactoring/transform.cli.ts help
 *
 * Без --write изменения только показываются: одиночная регулярка без ревью
 * слишком легко правит чужие места.
 */

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): string | undefined {
  const withEq = args.find((a) => a.startsWith(`--${name}=`));
  if (withEq) return withEq.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

const shouldWrite = args.includes('--write');
const targetPath = flag('path') ?? '.';

function printHelp(): void {
  console.log(`
РЕФАКТОРИНГ ПО РЕГУЛЯРНЫМ ВЫРАЖЕНИЯМ
============================================================
  replace --pattern="<regex>" --replace="<строка>" [--path=<dir>] [--write]
      Массовая замена по регулярному выражению. По умолчанию — только показ.

  rename-file --from=<путь> --to=<путь> [--write]
      Переименовать файл и обновить ссылки на него: относительные и алиасные
      импорты (алиасы берутся из agentica/tools/configurations/project.json).

  onpush [--path=angular] [--write]
      Компоненты без ChangeDetectionStrategy.OnPush: добавить changeDetection
      и недостающий импорт из @angular/core.

  help
      Эта справка.
============================================================`);
}

function printSummary(summary: TransformSummary): void {
  const changed = summary.results.filter((r) => r.changed);
  for (const result of changed) {
    console.log(`\n${result.filePath}  (${result.matchedCount} замен)`);
    for (const diff of result.diffs.slice(0, 3)) {
      console.log(`  - ${oneLine(diff.original)}\n  + ${oneLine(diff.replaced)}`);
    }
    if (result.diffs.length > 3) console.log(`  … ещё ${result.diffs.length - 3}`);
  }
  console.log(
    `\nФайлов просканировано: ${summary.scannedFiles}; изменено: ${summary.modifiedFiles}; замен: ${summary.totalReplacements}`,
  );
  if (summary.modifiedFiles > 0 && !shouldWrite) {
    console.log('Режим показа. Добавь --write, чтобы применить.');
  }
}

function oneLine(value: string): string {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > 160 ? flat.slice(0, 157) + '…' : flat;
}

function runReplace(): void {
  const pattern = flag('pattern');
  const replacement = flag('replace');
  if (!pattern || replacement === undefined) {
    console.error('Нужны --pattern и --replace');
    process.exit(1);
  }
  const rule: RegexTransformRule = {
    name: 'cli-replace',
    pattern: new RegExp(pattern, 'g'),
    replacement,
  };
  printSummary(
    RegexCodeTransformer.transform([targetPath], [rule], { dryRun: !shouldWrite }),
  );
}

function runRenameFile(): void {
  const from = flag('from');
  const to = flag('to');
  if (!from || !to) {
    console.error('Нужны --from и --to');
    process.exit(1);
  }
  const fromAbs = path.resolve(projectRoot(), from);
  const toAbs = path.resolve(projectRoot(), to);
  if (!fs.existsSync(fromAbs)) {
    console.error(`Нет файла: ${from}`);
    process.exit(1);
  }
  if (fs.existsSync(toAbs)) {
    console.error(`Цель уже существует: ${to}`);
    process.exit(1);
  }

  // Правила зависят от файла (относительный спецификатор у каждого свой),
  // поэтому обход идёт по файлам, а не одним набором правил на весь проект.
  const files = projectFiles();
  const summary: TransformSummary = {
    scannedFiles: 0,
    modifiedFiles: 0,
    totalReplacements: 0,
    results: [],
  };
  for (const file of files) {
    const part = RegexCodeTransformer.transform(
      [file],
      importPathRulesForFile(file, from, to),
      { dryRun: !shouldWrite },
    );
    summary.scannedFiles += part.scannedFiles;
    summary.modifiedFiles += part.modifiedFiles;
    summary.totalReplacements += part.totalReplacements;
    summary.results.push(...part.results);
  }
  printSummary(summary);

  if (shouldWrite) {
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });
    fs.renameSync(fromAbs, toAbs);
    console.log(`Переименован: ${from} -> ${to}`);
  } else {
    console.log('Режим показа. Добавь --write, чтобы переименовать и поправить ссылки.');
  }
}

const ONPUSH_IMPORT: RegexTransformRule = {
  name: 'onpush: импорт ChangeDetectionStrategy',
  pattern: /import\s*\{([^}]*)\}\s*from\s*(['"])@angular\/core\2/,
  replacement: (match: string, names: string, quote: string) =>
    names.includes('ChangeDetectionStrategy')
      ? match
      : `import {${names.replace(/\s*$/, '')}, ChangeDetectionStrategy } from ${quote}@angular/core${quote}`,
  filter: (file) => /\.ts$/.test(file) && !/\.spec\.ts$/.test(file),
};

const ONPUSH_OPTION: RegexTransformRule = {
  name: 'onpush: опция changeDetection',
  pattern: /@Component\(\{\s*(?![^)]*changeDetection)/,
  replacement: '@Component({\n  changeDetection: ChangeDetectionStrategy.OnPush,\n  ',
  filter: (file) => /\.ts$/.test(file) && !/\.spec\.ts$/.test(file),
};

/** Компоненты-фикстуры в тестах не рефакторим: у них нет рантайм-цены. */
function isTestFile(file: string): boolean {
  return /[\\/]tests?[\\/]/.test(file) || /\.(spec|test)\.ts$/.test(file);
}

function runOnPush(): void {
  const inScope = projectFiles().filter(
    (file) =>
      file.startsWith(path.resolve(projectRoot(), targetPath)) && !isTestFile(file),
  );
  const components = inScope.filter((file) => /@Component\(/.test(safeRead(file)));
  const files = components.filter(
    (file) => !/changeDetection:\s*ChangeDetectionStrategy\.OnPush/.test(safeRead(file)),
  );
  if (components.length === 0) {
    console.error(`Компонентов не найдено в ${targetPath}: проверь roots в configurations/project.json`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.log(`Все ${components.length} компонентов уже на OnPush.`);
    return;
  }
  console.log(`Компонентов без OnPush: ${files.length}`);
  printSummary(
    RegexCodeTransformer.transform(files, [ONPUSH_IMPORT, ONPUSH_OPTION], {
      dryRun: !shouldWrite,
    }),
  );
}

function safeRead(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

switch (command) {
  case 'replace':
    runReplace();
    break;
  case 'rename-file':
    runRenameFile();
    break;
  case 'onpush':
    runOnPush();
    break;
  case 'help':
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Неизвестная команда: ${command}\n`);
    printHelp();
    process.exit(1);
}
