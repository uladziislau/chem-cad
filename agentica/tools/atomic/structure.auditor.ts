/**
 * Аудитор структуры по эталонной модели (angular.conventions.md §1–§7).
 *
 * Проверяет:
 *   1. data/ существует
 *   2. domain/ не содержит @angular/* импортов
 *   3. каждый модуль в modules/ имеет barrel index.ts
 *   4. angular/adapters/ существует
 *   5. angular/initialization/ существует (или адаптер в angular/adapters/)
 *   6. angular/ui/app/app.component.ts или angular/ui/root/root.component.ts
 *   7. angular/app.routes.ts существует
 *   8. все компоненты имеют канонический суффикс
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectRoot, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

const CANONICAL_COMPONENT_SUFFIXES = [
  '.page.component.ts',
  '.ui.component.ts',
  '.layout.component.ts',
  '.component.ts',
];

const IS_TEST = /[\\/]tests?[\\/]|\.(spec|test)\.ts$/;
const IS_TOOLING = /^agentica[\\/]/;

interface Scan {
  root: string;
  angularDir: string;
  dataDir: string;
  domainDir: string;
  modulesDir: string;
}

function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listFiles(dir: string, pattern: RegExp): string[] {
  if (!isDirectory(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFiles(full, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function listDirs(dir: string): string[] {
  if (!isDirectory(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, e.name));
}

function push(findings: Finding[], file: string, message: string, severity: Finding['severity'], hint: string): void {
  findings.push({ file, message, severity, hint });
}

function checkDataDir(scan: Scan, findings: Finding[]): void {
  if (!isDirectory(scan.dataDir)) {
    push(findings, 'data/', 'Нет каталога data/ (source of truth)', 'critical',
      'создать data/ для JSON + тонких .ts-обёрток');
  }
}

function checkDomainPurity(scan: Scan, findings: Finding[]): string[] {
  if (!isDirectory(scan.domainDir)) return [];
  const domainFiles = listFiles(scan.domainDir, /\.ts$/);
  for (const file of domainFiles) {
    if (IS_TEST.test(file)) continue;
    if (fs.readFileSync(file, 'utf8').includes('@angular/')) {
      push(findings, rel(file), 'domain/ содержит Angular-импорт', 'critical',
        'перенести Angular-специфику в angular/modules/{domain}/');
    }
  }
  return domainFiles;
}

function checkModuleBarrels(scan: Scan, findings: Finding[]): string[] {
  if (!isDirectory(scan.modulesDir)) return [];
  const moduleDirs = listDirs(scan.modulesDir);
  for (const dir of moduleDirs) {
    if (!fs.existsSync(path.join(dir, 'index.ts'))) {
      push(findings, rel(dir) + '/', 'Модуль без barrel index.ts', 'warning',
        'создать index.ts, реэкспортирующий публичный API модуля');
    }
  }
  return moduleDirs;
}

function checkAdapters(scan: Scan, findings: Finding[]): void {
  if (!isDirectory(path.join(scan.angularDir, 'adapters'))) {
    push(findings, 'angular/adapters/', 'Нет каталога angular/adapters/ (DI-мост)', 'warning',
      'создать angular/adapters/ для DI-моста между Angular и Core');
  }
}

function checkInitialization(scan: Scan, findings: Finding[]): void {
  const initDir = path.join(scan.angularDir, 'initialization');
  const initAdapter = path.join(scan.angularDir, 'adapters', 'initialization.service.ts');
  if (!isDirectory(initDir) && !fs.existsSync(initAdapter)) {
    push(findings, 'angular/initialization/', 'Нет каталога angular/initialization/ (bootstrap-сервисы)', 'warning',
      'создать angular/initialization/ для bootstrap-сервисов или использовать angular/adapters/initialization.service.ts');
  }
}

function checkRootComponent(scan: Scan, findings: Finding[]): void {
  const appComponent = path.join(scan.angularDir, 'ui', 'app', 'app.component.ts');
  const rootComponent = path.join(scan.angularDir, 'ui', 'root', 'root.component.ts');
  if (!fs.existsSync(appComponent) && !fs.existsSync(rootComponent)) {
    push(findings, 'angular/ui/app/app.component.ts',
      'Нет корневой компонент: angular/ui/app/app.component.ts', 'warning',
      'создать app.component.ts в angular/ui/app/ или root.component.ts в angular/ui/root/');
  }
}

function checkAppRoutes(scan: Scan, findings: Finding[]): void {
  if (!fs.existsSync(path.join(scan.angularDir, 'app.routes.ts'))) {
    push(findings, 'angular/app.routes.ts', 'Нет angular/app.routes.ts', 'warning',
      'создать app.routes.ts в angular/');
  }
}

function checkComponentSuffixes(scan: Scan, findings: Finding[]): string[] {
  const componentFiles = listFiles(scan.angularDir, /\.component\.ts$/);
  for (const file of componentFiles) {
    if (IS_TEST.test(file) || IS_TOOLING.test(rel(file))) continue;
    const name = path.basename(file);
    if (!CANONICAL_COMPONENT_SUFFIXES.some((suffix) => name.endsWith(suffix))) {
      push(findings, rel(file), 'Компонент без канонического суффикса', 'warning',
        'переименовать в <имя>.ui.component.ts, <имя>.page.component.ts и т.д.');
    }
  }
  return componentFiles;
}

export function run(): AuditResult {
  const findings: Finding[] = [];
  const root = projectRoot();
  const scan: Scan = {
    root,
    angularDir: path.join(root, 'angular'),
    dataDir: path.join(root, 'data'),
    domainDir: path.join(root, 'domain'),
    modulesDir: path.join(root, 'modules'),
  };

  checkDataDir(scan, findings);
  const domainFiles = checkDomainPurity(scan, findings);
  const moduleDirs = checkModuleBarrels(scan, findings);
  checkAdapters(scan, findings);
  checkInitialization(scan, findings);
  checkRootComponent(scan, findings);
  checkAppRoutes(scan, findings);
  const componentFiles = checkComponentSuffixes(scan, findings);

  return result(
    'structure',
    'Структура по эталонной модели',
    domainFiles.length + componentFiles.length + moduleDirs.length,
    findings,
    `проверено файлов: ${domainFiles.length + componentFiles.length}, модулей: ${moduleDirs.length}, нарушений: ${findings.length}`,
  );
}
