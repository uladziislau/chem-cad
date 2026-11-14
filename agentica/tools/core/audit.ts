/**
 * Контракт аудиторов: один инструмент — один срез здоровья, без побочных
 * эффектов. Аудитор ничего не правит и не валит процесс: он возвращает
 * находки, а решение (отчёт, гейт, автофикс) принимает вызывающий.
 */

export type Severity = 'critical' | 'warning' | 'info';

export interface Finding {
  /** Путь от корня проекта. */
  file: string;
  line?: number;
  message: string;
  severity: Severity;
  /** Что сделать — конкретное действие, а не «исправить». */
  hint?: string;
}

export interface AuditResult {
  id: string;
  title: string;
  findings: Finding[];
  /** Число проверенных единиц (файлов, пар, компонентов) — для честного знаменателя. */
  checked: number;
  /** Одной строкой: что проверено и что найдено. */
  summary: string;
}

export interface Auditor {
  id: string;
  title: string;
  run(): AuditResult;
}

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, warning: 0, info: 0 };
  for (const finding of findings) counts[finding.severity]++;
  return counts;
}

export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function result(
  id: string,
  title: string,
  checked: number,
  findings: Finding[],
  summary: string,
): AuditResult {
  return { id, title, checked, findings, summary };
}
