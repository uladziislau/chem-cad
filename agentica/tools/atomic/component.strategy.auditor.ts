import { projectFiles, read, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * ChangeDetectionStrategy.OnPush в компонентах.
 *
 * Zoneless-приложение всё равно перерисовывает компонент по любому событию в
 * нём, если стратегия не задана: цена — лишние проверки шаблона на каждом
 * тике. Пропуск обычно не решение, а «забыл»: файл создан копированием
 * старого.
 *
 * Тестовые фикстуры не считаются: у них нет рантайм-цены.
 */

const IS_TEST = /[\\/]tests?[\\/]|\.(spec|test)\.ts$/;
const HAS_ONPUSH = /changeDetection:\s*ChangeDetectionStrategy\.OnPush/;

export function run(): AuditResult {
  const findings: Finding[] = [];
  let components = 0;

  for (const file of projectFiles(['.ts'])) {
    if (IS_TEST.test(file)) continue;
    const content = read(file);
    if (!/@Component\s*\(/.test(content)) continue;
    components++;
    if (HAS_ONPUSH.test(content)) continue;

    // Строка декоратора — чтобы правка была адресной.
    const line = content.split('\n').findIndex((text) => text.includes('@Component')) + 1;
    findings.push({
      file: rel(file),
      line,
      message: 'компонент без ChangeDetectionStrategy.OnPush',
      severity: 'warning',
      hint: 'npx tsx agentica/tools/refactoring/transform.cli.ts onpush --path=<каталог> --write',
    });
  }

  return result(
    'component-strategy',
    'Стратегия обнаружения изменений',
    components,
    findings,
    `компонентов: ${components}, без OnPush: ${findings.length}`,
  );
}
