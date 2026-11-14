import { projectFiles, read, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Строгий `null` в контрактах данных: где `any` и `as any`.
 *
 * `any` здесь не стилистическая придирка: в этом проекте он гасит именно те
 * ошибки, ради которых домен типизирован — форма записи из `data/`, единицы
 * измерения, отсутствие значения. Отчёт даёт карту: сколько, где и в каком
 * виде (`: any` в сигнатуре, `as any` в касте, `<any>` в дженерике).
 */

const IS_TEST = /[\\/]tests?[\\/]|\.(spec|test)\.ts$/;
const IS_TOOLING = /^agentica[\\/]/;

const FORMS: Record<string, RegExp> = {
  ': any': /:\s*any\b/,
  'as any': /\bas\s+any\b/,
  '<any>': /<\s*any\s*>/,
  'any[]': /\bany\s*\[\s*\]/,
};

interface Hit {
  line: number;
  form: string;
  text: string;
}

function scanFile(file: string, totals: Record<string, number>): Hit[] {
  const hits: Hit[] = [];
  for (const [index, text] of read(file).split('\n').entries()) {
    for (const [form, pattern] of Object.entries(FORMS)) {
      if (!pattern.test(text)) continue;
      totals[form] = (totals[form] ?? 0) + 1;
      hits.push({ line: index + 1, form, text: text.trim() });
    }
  }
  return hits;
}

function isTarget(file: string): boolean {
  return !(IS_TEST.test(file) || IS_TOOLING.test(rel(file)) || file.endsWith('.d.ts'));
}

export function run(): AuditResult {
  const findings: Finding[] = [];
  const totals: Record<string, number> = {};
  let checked = 0;

  for (const file of projectFiles(['.ts'])) {
    if (!isTarget(file)) continue;
    checked++;
    const hits = scanFile(file, totals);
    if (hits.length === 0) continue;
    findings.push({
      file: rel(file),
      line: hits[0].line,
      message: `${hits.length} ${hits.length === 1 ? 'вхождение' : 'вхождений'} any: ${hits[0].text.slice(0, 90)}`,
      severity: hits.length > 5 ? 'warning' : 'info',
      hint: 'назвать тип данных; в D3-колбэках — тип из @types/d3',
    });
  }

  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warning' ? -1 : 1));
  const byForm = Object.entries(totals)
    .map(([form, count]) => `${form}: ${count}`)
    .join(', ');

  return result(
    'type-safety',
    'Карта any в домене и адаптерах',
    checked,
    findings,
    `файлов: ${checked}, с any: ${findings.length}${byForm ? ` (${byForm})` : ''}`,
  );
}
