import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectRoot, read, rel } from '../core/paths';
import { resolveSpecifier } from '../core/resolve';

/**
 * Маршруты приложения и файлы, которые они грузят.
 *
 * Probe без вердикта: печатает `path → компонент` и проверяет, что ленивый
 * импорт разрешается в существующий файл. Ошибку сборка поймает, но
 * полезно видеть карту целиком — особенно после переездов каталогов.
 */

const ROUTES_FILE = 'angular/app.routes.ts';
const LAZY = /path:\s*['"]([^'"]*)['"]|loadComponent:\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g;

interface RouteRow {
  route: string;
  specifier: string;
  file: string;
  exists: boolean;
}

export function run(): void {
  const routesPath = path.resolve(projectRoot(), ROUTES_FILE);
  if (!fs.existsSync(routesPath)) {
    console.error(`Нет файла маршрутов: ${ROUTES_FILE}`);
    return;
  }
  const content = read(routesPath);

  const rows: RouteRow[] = [];
  let pendingRoute: string | null = null;
  for (const match of content.matchAll(LAZY)) {
    if (match[1] !== undefined) {
      pendingRoute = match[1];
      continue;
    }
    const specifier = match[2];
    const resolved = resolveSpecifier(specifier, routesPath);
    rows.push({
      route: pendingRoute ?? '?',
      specifier,
      file: resolved ? rel(resolved) : '—',
      exists: Boolean(resolved),
    });
    pendingRoute = null;
  }

  const width = Math.max(...rows.map((row) => row.route.length), 5);
  for (const row of rows) {
    const mark = row.exists ? '✓' : '✗';
    console.log(`${mark} ${row.route.padEnd(width)}  ${row.file}`);
  }

  const broken = rows.filter((row) => !row.exists);
  console.log(
    `\nМаршрутов: ${rows.length}, битых ссылок: ${broken.length}` +
      (broken.length ? ` (${broken.map((row) => row.specifier).join(', ')})` : ''),
  );

  // Маршруты без компонента — редиректы и группировки: их полезно видеть.
  const withoutComponent = [...content.matchAll(/path:\s*['"]([^'"]*)['"]/g)]
    .map((match) => match[1])
    .filter((route) => route && !rows.some((row) => row.route === route));
  if (withoutComponent.length) {
    console.log(`Без loadComponent (redirect/группа): ${withoutComponent.join(', ')}`);
  }
}
