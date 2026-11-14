import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectRoot, readJson, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Пустые каталоги под корнями проекта.
 *
 * Каталог без файлов — след переезда: он обещает слой, которого нет, и
 * попадает в списки «где что лежит» у человека и агента. Git такие каталоги
 * не хранит, поэтому они копятся только локально и живут до первой уборки.
 */

const SKIP: Record<string, true> = {
  node_modules: true,
  dist: true,
  '.angular': true,
  'out-tsc': true,
  build: true,
  '.git': true,
  '.probe': true,
};

/** true — в каталоге есть файлы хотя бы на одной глубине. */
function scanDir(dir: string, out: string[]): boolean {
  let hasFiles = false;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP[entry.name]) continue;
    if (entry.isDirectory()) {
      if (scanDir(path.join(dir, entry.name), out)) hasFiles = true;
    } else {
      hasFiles = true;
    }
  }
  if (entries.length === 0) out.push(dir);
  return hasFiles;
}

export function run(): AuditResult {
  const config = readJson<{ roots?: string[] }>(path.resolve(projectRoot(), 'agentica/tools/configurations/project.json'));
  const roots = config?.roots ?? ['angular'];
  const findings: Finding[] = [];
  let checked = 0;

  for (const root of roots) {
    const full = path.resolve(projectRoot(), root);
    if (!fs.existsSync(full)) continue;
    const empty: string[] = [];
    scanDir(full, empty);
    for (const dir of empty) {
      checked++;
      findings.push({
        file: rel(dir),
        message: 'каталог без файлов',
        severity: 'warning',
        hint: 'rmdir, если слой не планируется',
      });
    }
  }

  return result(
    'empty-dirs',
    'Пустые каталоги',
    checked,
    findings,
    `корней: ${roots.length}, пустых каталогов: ${findings.length}`,
  );
}
