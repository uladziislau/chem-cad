import * as path from 'node:path';
import { projectFiles, read, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Роль файла против его содержимого.
 *
 * Имя — не украшение: по суффиксу агент и человек решают, что внутри, до
 * открытия. `production-adapter.ts` с `@Injectable` ищется как сервис, а
 * `x.page.ts` рядом с `x.page.component.ts` заводит вторую конвенцию для
 * одного класса файлов.
 *
 * Аудитор сверяет не вкус, а объявленный декоратор: `@Component` обязан
 * попасть в `.component.ts` или в один из page-суффиксов, `@Injectable` —
 * в роль из списка. Пустой `<имя>.ts` без класса (кроме индексных файлов)
 * отмечается как info: там может быть чистый модуль, но чаще — забытый
 * файл.
 */

const COMPONENT_ROLES = ['.component.ts', '.page.ts', '.ui.page.ts'];

const INJECTABLE_ROLES = [
  '.service.ts',
  '.facade.ts',
  '.store.ts',
  '.strategy.ts',
  '.adapter.ts',
  '.guard.ts',
  '.resolver.ts',
  '.repository.ts',
  '.interceptor.ts',
  '.factory.ts',
  '.pipe.ts',
  '.directive.ts',
];

const IS_TEST = /[\\/]tests?[\\/]|\.(spec|test)\.ts$/;
/** Сам слой инструментов — не Angular-код: в нём живут строки с `@Component(`. */
const IS_TOOLING = /^agentica[\\/]/;

function hasAny(file: string, roles: string[]): boolean {
  return roles.some((role) => file.endsWith(role));
}

export function run(): AuditResult {
  const findings: Finding[] = [];
  const files = projectFiles(['.ts']);
  let components = 0;
  let injectables = 0;

  for (const file of files) {
    if (IS_TEST.test(file) || IS_TOOLING.test(rel(file))) continue;
    const content = read(file);
    if (!content) continue;
    const relative = rel(file);
    const base = path.basename(file);

    if (/@Component\s*\(/.test(content)) {
      components++;
      if (!hasAny(base, COMPONENT_ROLES)) {
        findings.push({
          file: relative,
          message: `компонент без суффикса роли: ${base}`,
          severity: 'warning',
          hint: 'переименовать в <имя>.ui.component.ts или <имя>.page.component.ts',
        });
      } else if (base.endsWith('.page.ts')) {
        findings.push({
          file: relative,
          message: `page-суффикс .page.ts рядом с .page.component.ts`,
          severity: 'warning',
          hint: 'в проекте две конвенции для страниц — оставить одну',
        });
      }
    }

    if (/@Injectable\s*\(/.test(content)) {
      injectables++;
      if (!hasAny(base, INJECTABLE_ROLES)) {
        findings.push({
          file: relative,
          message: `инжектируемый класс без суффикса роли: ${base}`,
          severity: 'warning',
          hint: 'роль из списка: service, facade, store, strategy, adapter, guard, resolver, repository, factory',
        });
      }
    }

  }

  return result(
    'file-naming',
    'Роль файла соответствует содержимому',
    files.length,
    findings,
    `файлов: ${files.length}, компонентов: ${components}, инжектируемых: ${injectables}, расхождений: ${findings.length}`,
  );
}
