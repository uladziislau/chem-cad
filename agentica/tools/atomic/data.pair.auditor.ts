import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectFiles, readJson, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Связка «данные → типизированное описание».
 *
 * В проекте `.data.ts` — не обязательно пара к JSON: он бывает и
 * самостоятельным набором констант. Дефект один: файл импортирует JSON,
 * которого рядом нет (переименовали, перенесли), или JSON не разбирается.
 * Такую ошибку сборка ловит только при импорте в рантайме — в тестах это
 * падение на загрузке данных, а не на типах.
 */

const JSON_IMPORT = /from\s+['"]([^'"]+\.json)['"]/g;

export function run(): AuditResult {
  const findings: Finding[] = [];
  const files = projectFiles(['.ts', '.json']);
  let pairs = 0;
  let brokenJson = 0;

  for (const file of files.filter((name) => name.endsWith('.json'))) {
    if (readJson(file) !== null) continue;
    brokenJson++;
    findings.push({
      file: rel(file),
      message: 'JSON не разбирается',
      severity: 'critical',
      hint: 'починить синтаксис: файл читается сервером и тестами',
    });
  }

  for (const file of files.filter((name) => name.endsWith('.ts'))) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(JSON_IMPORT)) {
      const specifier = match[1];
      if (!specifier.startsWith('.')) continue;
      pairs++;
      const target = path.resolve(path.dirname(file), specifier);
      if (fs.existsSync(target)) continue;
      findings.push({
        file: rel(file),
        message: `импортирует отсутствующий JSON: ${specifier}`,
        severity: 'critical',
        hint: 'вернуть файл или поправить имя',
      });
    }
  }

  return result(
    'data-pairs',
    'Связка данных: .data.ts и его JSON',
    pairs,
    findings,
    `JSON-файлов: ${files.filter((f) => f.endsWith('.json')).length}, связок .data.ts → JSON: ${pairs}, ` +
      `битых: ${brokenJson}, отсутствующих: ${findings.length - brokenJson}`,
  );
}
