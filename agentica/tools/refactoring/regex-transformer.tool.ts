import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadConfig, projectRoot, walkFiles } from '../core/paths';

/**
 * Ядро рефакторинга по регулярным выражениям.
 *
 * Задача слоя agentica — быстрые массовые правки кода там, где AST-кодмод
 * дороже регулярка: переименование пути вместе с импортами, нормализация
 * синтаксиса, внедрение пресетов. Правило обязано быть узким: широкий pattern
 * в одиночном прогоне меняет чужие места, поэтому CLI по умолчанию dry-run.
 */

export interface RegexTransformRule {
  name: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
  /** Дополнительный фильтр по файлу — например, только .ts, не .spec.ts */
  filter?: (filePath: string, content: string) => boolean;
}

export interface TransformResult {
  filePath: string;
  matchedCount: number;
  changed: boolean;
  diffs: { original: string; replaced: string }[];
}

export interface TransformSummary {
  scannedFiles: number;
  modifiedFiles: number;
  totalReplacements: number;
  results: TransformResult[];
}

export class RegexCodeTransformer {
  static transform(
    targets: string[],
    rules: RegexTransformRule[],
    options: { dryRun?: boolean } = {},
  ): TransformSummary {
    const files = collectFiles(targets);
    const summary: TransformSummary = {
      scannedFiles: files.length,
      modifiedFiles: 0,
      totalReplacements: 0,
      results: [],
    };

    for (const file of files) {
      const applied = applyRules(file, rules, options.dryRun ?? true);
      if (applied.changed) {
        summary.modifiedFiles++;
        summary.totalReplacements += applied.matchedCount;
      }
      summary.results.push(applied);
    }
    return summary;
  }
}

function collectFiles(targets: string[]): string[] {
  const config = loadConfig();
  const extensions = config.extensions ?? ['.ts'];
  const skipDirs = new Set(
    config.skipDirs ?? ['node_modules', 'dist', '.angular', 'out-tsc', 'build', '.git'],
  );
  const files: string[] = [];
  for (const target of targets) {
    const full = path.isAbsolute(target) ? target : path.resolve(projectRoot(), target);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) walkFiles(full, extensions, skipDirs, files);
    else files.push(full);
  }
  return files;
}

function applyRules(file: string, rules: RegexTransformRule[], dryRun: boolean): TransformResult {
  const original = fs.readFileSync(file, 'utf8');
  let current = original;
  let count = 0;
  const diffs: { original: string; replaced: string }[] = [];

  for (const rule of rules) {
    if (rule.filter && !rule.filter(file, current)) continue;
    if (!current.match(rule.pattern)) continue;
    count += (current.match(rule.pattern) ?? []).length;
    current = current.replace(rule.pattern, (match: string, ...args: string[]) => {
      const replaced =
        typeof rule.replacement === 'function' ? rule.replacement(match, ...args) : rule.replacement;
      diffs.push({ original: match.trim(), replaced: replaced.trim() });
      return replaced;
    });
  }

  const changed = current !== original;
  if (changed && !dryRun) fs.writeFileSync(file, current, 'utf8');
  return {
    filePath: path.relative(projectRoot(), file),
    matchedCount: count,
    changed,
    diffs,
  };
}

const TS_EXT = /\.tsx?$/;

function stripExt(file: string): string {
  return file.replace(TS_EXT, '');
}

function relativeSpecifier(filePath: string, absTarget: string): string {
  let rel = path.relative(path.dirname(filePath), absTarget).split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

/**
 * Правила для одного файла: все формы записи пути к переименовываемому файлу
 * — относительная от этого файла, абсолютная от корня и алиасная.
 * Относительная форма у каждого файла своя, поэтому правила строятся на файл.
 */
export function importPathRulesForFile(
  filePath: string,
  fromPath: string,
  toPath: string,
): RegexTransformRule[] {
  const root = projectRoot();
  const fromAbs = stripExt(path.resolve(root, fromPath));
  const toAbs = stripExt(path.resolve(root, toPath));

  const forms = new Map<string, string>();
  forms.set(relativeSpecifier(filePath, fromAbs), relativeSpecifier(filePath, toAbs));
  forms.set(fromAbs, toAbs);

  for (const [alias, target] of Object.entries(loadConfig().aliases ?? {})) {
    const targetAbs = path.resolve(root, target);
    if (!fromAbs.startsWith(targetAbs + path.sep)) continue;
    forms.set(
      alias + fromAbs.slice(targetAbs.length),
      alias + toAbs.slice(targetAbs.length),
    );
  }

  return Array.from(forms, ([from, to]) => ({
    name: `import: ${from} -> ${to}`,
    pattern: new RegExp(`(['"\`])${escapeRegExp(from)}(\\.tsx?)?\\1`, 'g'),
    replacement: (_match: string, quote: string) => `${quote}${to}${quote}`,
  }));
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
