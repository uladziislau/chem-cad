import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseSpecifiers, resolveSpecifier } from '../core/resolve';
import { aliases, projectFiles, projectRoot, read } from '../core/paths';

/**
 * Граф зависимостей контекстов `angular/modules`.
 *
 * Probe без вердикта: показывает, кто на кого опирается, и печатает граф
 * в mermaid. Нужен, когда решаешь, куда отнести контракт, — по числам
 * входящих видно, какой контекст стал общим узлом.
 */

const MODULES_DIR = 'angular/modules';

function contextOf(absolutePath: string): string | null {
  const root = path.resolve(projectRoot(), MODULES_DIR);
  if (!absolutePath.startsWith(root + path.sep)) return null;
  const rest = absolutePath.slice(root.length + 1).split(path.sep);
  return rest.length > 1 ? rest[0] : null;
}

interface Graph {
  contexts: string[];
  edges: Map<string, Set<string>>;
}

function buildGraph(): Graph {
  const root = path.resolve(projectRoot(), MODULES_DIR);
  if (!fs.existsSync(root)) return { contexts: [], edges: new Map() };
  const contexts = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const edges = new Map<string, Set<string>>(contexts.map((name) => [name, new Set<string>()]));

  for (const file of projectFiles(['.ts'])) {
    const from = contextOf(file);
    if (!from) continue;
    for (const specifier of parseSpecifiers(read(file))) {
      const resolved = resolveSpecifier(specifier, file);
      const to = resolved ? contextOf(resolved) : null;
      if (!to || to === from) continue;
      edges.get(from)?.add(to);
    }
  }
  return { contexts, edges };
}

function printTable({ contexts, edges }: Graph): void {
  const incoming = new Map<string, number>(contexts.map((name) => [name, 0]));
  const outgoing = new Map<string, number>(contexts.map((name) => [name, 0]));
  for (const [from, targets] of edges) {
    outgoing.set(from, targets.size);
    for (const to of targets) incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }

  console.log(`Контекстов: ${contexts.length}\n`);
  console.log('контекст'.padEnd(24) + 'входит  исходит  зависит от');
  for (const name of contexts) {
    const targets = [...(edges.get(name) ?? [])].sort().join(', ');
    console.log(
      name.padEnd(24) +
        String(incoming.get(name)).padEnd(8) +
        String(outgoing.get(name)).padEnd(9) +
        (targets || '—'),
    );
  }

  const busiest = [...incoming.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log('\nСамые общие узлы: ' + busiest.map(([name, count]) => `${name} (${count})`).join(', '));
}

function printMermaid({ edges }: Graph): void {
  console.log('\n```mermaid');
  console.log('graph LR');
  for (const [from, targets] of edges) {
    for (const to of [...targets].sort()) console.log(`  ${from} --> ${to}`);
  }
  console.log('```');
}

export function run(): void {
  const graph = buildGraph();
  printTable(graph);
  printMermaid(graph);
  console.log(`\nАлиасы: ${Object.keys(aliases()).join(', ')}`);
  console.log(`Файлов просмотрено: ${projectFiles(['.ts']).length}`);
}
