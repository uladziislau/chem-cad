import { countBySeverity, type AuditResult, type Auditor } from '../core/audit';
import { run as circularDeps } from '../atomic/circular.dependency.auditor';
import { run as componentStrategy } from '../atomic/component.strategy.auditor';
import { run as dataPairs } from '../atomic/data.pair.auditor';
import { run as deadFiles } from '../atomic/dead.files.auditor';
import { run as deadPaths } from '../atomic/dead.path.auditor';
import { run as emptyDirs } from '../atomic/empty.dir.auditor';
import { run as fileNaming } from '../atomic/file.naming.auditor';
import { run as importDepth } from '../atomic/import.alias.auditor';
import { run as structure } from '../atomic/structure.auditor';
import { run as typeSafety } from '../atomic/type.safety.auditor';

/**
 * Реестр аудиторов и сводный отчёт.
 *
 * Список — единственное место, где аудиторы объявлены: CLI и композит читают
 * его отсюда, поэтому новый инструмент не нужно регистрировать дважды.
 */

export const AUDITORS: Auditor[] = [
  { id: 'circular-deps', title: 'Циклы между контекстами', run: circularDeps },
  { id: 'dead-files', title: 'Достижимость файлов', run: deadFiles },
  { id: 'dead-paths', title: 'Живость путей в tsconfig', run: deadPaths },
  { id: 'component-strategy', title: 'OnPush в компонентах', run: componentStrategy },
  { id: 'file-naming', title: 'Роль файла по содержимому', run: fileNaming },
  { id: 'import-depth', title: 'Глубина относительных импортов', run: importDepth },
  { id: 'structure', title: 'Структура по эталонной модели', run: structure },
  { id: 'type-safety', title: 'Карта any', run: typeSafety },
  { id: 'data-pairs', title: 'Связка данных', run: dataPairs },
  { id: 'empty-dirs', title: 'Пустые каталоги', run: emptyDirs },
];

export interface Report {
  results: AuditResult[];
  critical: number;
  warnings: number;
  infos: number;
  /** Доля проверок без критичных находок: 100 — чисто. */
  health: number;
}

export function auditAll(only?: string[]): Report {
  const selected = only?.length
    ? AUDITORS.filter((auditor) => only.includes(auditor.id))
    : AUDITORS;
  const results = selected.map((auditor) => auditor.run());

  let critical = 0;
  let warnings = 0;
  let infos = 0;
  for (const item of results) {
    const counts = countBySeverity(item.findings);
    critical += counts.critical;
    warnings += counts.warning;
    infos += counts.info;
  }

  const health = results.length
    ? Math.round((results.filter((item) => countBySeverity(item.findings).critical === 0).length / results.length) * 100)
    : 100;

  return { results, critical, warnings, infos, health };
}
