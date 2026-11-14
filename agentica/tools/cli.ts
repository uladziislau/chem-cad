import { AUDITORS, auditAll } from './composite/audit';
import { PROBES } from './probes/registry';
import type { Finding } from './core/audit';

/**
 * Единая точка входа инструментов агента.
 *
 *   npx tsx agentica/tools/cli.ts list
 *   npx tsx agentica/tools/cli.ts audit [--only=id] [--verbose] [--strict]
 *   npx tsx agentica/tools/cli.ts probe <name>
 *
 * `audit` печатает сводку и находки уровня critical/warning. `--strict`
 * роняет процесс при любом critical — так отчёт можно включить в CI, не
 * превращая его в ещё один источник шума.
 */

const args = process.argv.slice(2);
const command = args[0];

function flagValue(name: string): string | undefined {
  const withEq = args.find((arg) => arg.startsWith(`--${name}=`));
  if (withEq) return withEq.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function printHelp(): void {
  console.log(`
ИНСТРУМЕНТЫ АГЕНТА — CHEM-CAD
============================================================
  list                 Список аудиторов.
  audit [--only=<id,id>] [--verbose] [--strict]
                       Сводный аудит: индексы, находки, индекс здоровья.
                       --verbose показывает info-находки, --strict роняет
                       процесс при critical.
  probe <name>         Диагностика без вердикта: ${Object.keys(PROBES).join(', ')}.
  help                 Эта справка.

Рефакторинг — отдельный CLI:
  npx tsx agentica/tools/refactoring/transform.cli.ts help
  Поиск: npx tsx agentica/tools/search/search.cli.ts "<pattern>"
============================================================`);
}

function printFinding(finding: Finding): void {
  const place = finding.line ? `${finding.file}:${finding.line}` : finding.file;
  console.log(`  [${finding.severity}] ${place}`);
  console.log(`      ${finding.message}`);
  if (finding.hint) console.log(`      → ${finding.hint}`);
}

function runAudit(): void {
  const only = flagValue('only')?.split(',').map((id) => id.trim()).filter(Boolean);
  const verbose = hasFlag('verbose');
  const report = auditAll(only);

  for (const item of report.results) {
    const visible = item.findings.filter(
      (finding) => verbose || finding.severity !== 'info',
    );
    console.log(`\n── ${item.id}: ${item.title}`);
    console.log(`   ${item.summary}`);
    for (const finding of visible) printFinding(finding);
  }

  console.log('\n' + '='.repeat(60));
  console.log(
    `Итог: critical ${report.critical}, warning ${report.warnings}` +
      (verbose ? `, info ${report.infos}` : '') +
      `; индекс здоровья ${report.health}%`,
  );

  if (hasFlag('strict') && report.critical > 0) process.exit(1);
}

function runProbe(): void {
  const name = args[1];
  if (!name || !PROBES[name]) {
    console.error(`Укажи probe: ${Object.keys(PROBES).join(', ')}`);
    process.exit(1);
  }
  PROBES[name].run();
}

switch (command) {
  case 'list':
    for (const auditor of AUDITORS) console.log(`${auditor.id.padEnd(20)} ${auditor.title}`);
    break;
  case 'audit':
    runAudit();
    break;
  case 'probe':
    runProbe();
    break;
  case 'help':
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Неизвестная команда: ${command}\n`);
    printHelp();
    process.exit(1);
}
