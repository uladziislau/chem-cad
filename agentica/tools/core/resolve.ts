import * as fs from 'node:fs';
import * as path from 'node:path';
import { aliases, projectRoot, read } from './paths';

/**
 * Разрешение спецификатора импорта в файл проекта.
 *
 * Одна функция на всех: анализ циклов, достижимости и правка импортов должны
 * видеть один и тот же граф. Правила простые и без магии: алиас из
 * configurations/project.json либо относительный путь, затем расширения и
 * `index.ts`, как это делает сборщик.
 */

const EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs'];

export function parseSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

function specifierBase(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith('node:')) return null;
  for (const [alias, target] of Object.entries(aliases())) {
    // Точная форма (`@ui/desktop`) и подпуть (`@modules/x/y`) — оба вида.
    if (specifier === alias) return path.resolve(projectRoot(), target);
    if (!specifier.startsWith(alias + '/')) continue;
    return path.resolve(projectRoot(), target + specifier.slice(alias.length));
  }
  return specifier.startsWith('.') ? path.resolve(path.dirname(fromFile), specifier) : null;
}

/** Первый существующий файл по базирусу: расширения, затем index. */
function probeFile(base: string): string | null {
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) {
    const indexFile = path.join(base, 'index' + ext);
    if (fs.existsSync(indexFile)) return indexFile;
  }
  return null;
}

export function resolveSpecifier(specifier: string, fromFile: string): string | null {
  const base = specifierBase(specifier, fromFile);
  return base ? probeFile(base) : null;
}

/** Все имена, которые файл выставляет наружу. */
export function exportedNames(content: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /export\s+(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+const\s+([A-Za-z_$][\w$]*)/g,
    /export\s+let\s+([A-Za-z_$][\w$]*)/g,
    /export\s+interface\s+([A-Za-z_$][\w$]*)/g,
    /export\s+type\s+([A-Za-z_$][\w$]*)/g,
    /export\s+enum\s+([A-Za-z_$][\w$]*)/g,
    /export\s*\{([^}]+)\}/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (pattern.source.startsWith('export\\s*\\{')) {
        for (const part of match[1].split(',')) {
          const name = part.split(/\s+as\s+/).pop()?.trim();
          if (name) names.add(name);
        }
      } else {
        names.add(match[1]);
      }
    }
  }
  return [...names];
}

/** Имена, импортированные из конкретного файла через `import { … }`. */
export function importedNamesFrom(content: string, specifier: string): string[] {
  const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names: string[] = [];
  const pattern = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${escaped}['"]`, 'g');
  for (const match of content.matchAll(pattern)) {
    for (const part of match[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0];
      if (name) names.push(name);
    }
  }
  // Динамическая загрузка: import('@modules/x').then(m => m.Page)
  const dynamic = new RegExp(`import\\(\\s*['"]${escaped}['"]\\s*\\)[^;]*?m\\.([A-Za-z_$][\\w$]*)`, 'g');
  for (const match of content.matchAll(dynamic)) names.push(match[1]);
  return names;
}

export function readSafe(file: string): string {
  return read(file);
}
