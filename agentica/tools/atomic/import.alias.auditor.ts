import { aliases, projectFiles, read, rel } from '../core/paths';
import { parseSpecifiers } from '../core/resolve';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Глубокие относительные импорты вместо алиасов.
 *
 * `../../../services/x` привязан к месту файла: перенос каталога на уровень
 * выше ломает не логику, а строку, и правка расползается по десяткам файлов.
 * Алиас (`@modules/...`) переживает переезд, потому что его цель объявлена
 * один раз в tsconfig.
 *
 * Порог «глубокий» — три уровня подъёма: `../../` ещё читаемо, `../../../`
 * уже требует считать каталоги.
 */

const DEEP = /^(?:\.\.\/){3,}/;

export function run(): AuditResult {
  const findings: Finding[] = [];
  const available = Object.keys(aliases());
  let checked = 0;

  for (const file of projectFiles(['.ts'])) {
    checked++;
    const lines = read(file).split('\n');
    for (const [index, line] of lines.entries()) {
      for (const specifier of parseSpecifiers(line)) {
        if (!DEEP.test(specifier)) continue;
        const depth = (specifier.match(/\.\.\//g) ?? []).length;
        findings.push({
          file: rel(file),
          line: index + 1,
          message: `относительный импорт на ${depth} уровней: ${specifier}`,
          severity: depth >= 4 ? 'warning' : 'info',
          hint: available.length ? `заменить на алиас (${available.slice(0, 4).join(', ')}…)` : undefined,
        });
      }
    }
  }

  return result(
    'import-depth',
    'Глубина относительных импортов',
    checked,
    findings,
    `файлов: ${checked}, глубоких импортов: ${findings.length}`,
  );
}
