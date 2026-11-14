import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectRoot, readJson, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Мёртвые пути в конфигурации TypeScript.
 *
 * `include` с несуществующим каталогом и алиас, ведущий в удалённое место,
 * выглядят как порядок, но ничего не проверяют: сборка молчит, потому что
 * пустой глоб — не ошибка, а импорт «через алиас» просто не найдётся, когда
 * кто-то напишет его первым. Такие записи копятся после переездов.
 *
 * Проверяются оба tsconfig проекта: корневой (домен, сервер, инструменты) и
 * Angular-сборки (алиасы шаблонов и импортов).
 */

interface TsConfig {
  compilerOptions?: { paths?: Record<string, string[]> };
  include?: string[];
}

const CONFIGS = ['tsconfig.json', 'angular/tsconfig.json'];
const IS_GLOB = /[*?]/;

function globLooksAlive(target: string): boolean {
  // Глоб без совпадений — тоже мёртвый, но проверить честно можно только
  // каталог до первой звёздочки: если его нет, глоб пустой по определению.
  const staticPart = target.split(/[*?]/)[0];
  return fs.existsSync(path.dirname(staticPart));
}

function checkAliases(name: string, config: TsConfig, configDir: string, root: string): Finding[] {
  const findings: Finding[] = [];
  for (const [alias, targets] of Object.entries(config.compilerOptions?.paths ?? {})) {
    for (const target of targets) {
      const resolved = path.resolve(configDir, target);
      if (IS_GLOB.test(target) ? globLooksAlive(resolved) : fs.existsSync(resolved)) continue;
      findings.push({
        file: name,
        message: `алиас ${alias} ведёт в несуществующий путь: ${path.relative(root, resolved)}`,
        severity: 'critical',
        hint: 'удалить алиас или поправить цель',
      });
    }
  }
  return findings;
}

function checkInclude(name: string, config: TsConfig, configDir: string, root: string): Finding[] {
  const findings: Finding[] = [];
  for (const include of config.include ?? []) {
    const firstSegment = include.split('/')[0];
    if (IS_GLOB.test(firstSegment)) continue;
    const dir = path.resolve(configDir, firstSegment);
    if (!fs.existsSync(dir)) {
      findings.push({
        file: name,
        message: `include смотрит в несуществующий каталог: ${path.relative(root, include)}`,
        severity: 'critical',
        hint: 'убрать путь из include',
      });
      continue;
    }
    if (IS_GLOB.test(include)) continue;
    const file = path.resolve(configDir, include);
    const hasGlobAfterFirst = IS_GLOB.test(include.slice(firstSegment.length));
    if (!hasGlobAfterFirst && !fs.existsSync(file)) {
      findings.push({
        file: name,
        message: `include указывает на отсутствующий файл: ${rel(file)}`,
        severity: 'critical',
        hint: 'убрать путь из include',
      });
    }
  }
  return findings;
}

export function run(): AuditResult {
  const root = projectRoot();
  const findings: Finding[] = [];
  let checked = 0;

  for (const name of CONFIGS) {
    const configPath = path.resolve(root, name);
    if (!fs.existsSync(configPath)) continue;
    const config = readJson<TsConfig>(configPath);
    if (!config) {
      findings.push({
        file: name,
        message: 'конфигурация не разбирается как JSON',
        severity: 'critical',
        hint: 'JSONC с комментариями сюда не годится — нужен чистый JSON',
      });
      continue;
    }
    const configDir = path.dirname(configPath);
    checked += Object.keys(config.compilerOptions?.paths ?? {}).length + (config.include?.length ?? 0);
    findings.push(...checkAliases(name, config, configDir, root));
    findings.push(...checkInclude(name, config, configDir, root));
  }

  return result(
    'dead-paths',
    'Живость путей в tsconfig',
    checked,
    findings,
    `конфигураций: ${CONFIGS.length}, путей проверено: ${checked}, мёртвых: ${findings.length}`,
  );
}
