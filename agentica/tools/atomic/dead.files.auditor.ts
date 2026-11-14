import { projectFiles, read, rel } from '../core/paths';
import { parseSpecifiers, resolveSpecifier } from '../core/resolve';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Файлы, недостижимые от точек входа.
 *
 * Ошибку «импорт не найден» ловит сборка, обратную — никто: файл, до которого
 * не доходит ни одна цепочка импортов, остаётся в дереве и выглядит живым.
 * Проверять по имени файла нельзя: маршруты грузят модуль через
 * `import('@modules/x').then(m => m.Page)`, то есть по имени класса, а не
 * файла, — такой файл выглядит «без ссылок», хотя он и есть страница.
 *
 * Поэтому считается достижимость в графе импортов от настоящих входов:
 * main, маршруты, сервер, тесты, инструменты. Всё, что не достигнуто, —
 * кандидат на удаление или на подключение.
 */

const ROOT_PATTERNS: RegExp[] = [
  /^angular\/main\.ts$/,
  /^angular\/app\.routes\.ts$/,
  /^angular\/app\.config\.ts$/,
  /^angular\/[^/]*\.routes\.ts$/,
  /^angular\/.*\.routes\.ts$/,
  /^server\/[^/]+\.ts$/,
  /^vitest\.config\.ts$/,
  /^tsconfig[^/]*\.json$/,
];

const IS_INPUT = /[\\/]tests?[\\/]|\.(spec|test)\.ts$/;

export function run(): AuditResult {
  const files = projectFiles(['.ts']);
  const contents = new Map<string, string>();
  for (const file of files) contents.set(file, read(file));

  const roots = files.filter((file) => {
    const relative = rel(file);
    return ROOT_PATTERNS.some((pattern) => pattern.test(relative)) || IS_INPUT.test(file);
  });

  // Достижимость в ширину по графу импортов.
  const reached = new Set<string>(roots);
  const queue = [...roots];
  while (queue.length) {
    const file = queue.pop()!;
    for (const specifier of parseSpecifiers(contents.get(file) ?? '')) {
      const target = resolveSpecifier(specifier, file);
      if (!target || reached.has(target)) continue;
      reached.add(target);
      queue.push(target);
    }
  }

  const rootSet = new Set(roots);
  const findings: Finding[] = [];
  for (const file of files) {
    if (reached.has(file) || rootSet.has(file)) continue;
    findings.push({
      file: rel(file),
      message: 'недостижим по импортам от точек входа',
      severity: 'warning',
      hint: 'удалить; если это вход по соглашению — добавить шаблон в ROOT_PATTERNS',
    });
  }

  return result(
    'dead-files',
    'Достижимость файлов от точек входа',
    files.length,
    findings,
    `файлов: ${files.length}, входов: ${roots.length}, недостижимых: ${findings.length}`,
  );
}
