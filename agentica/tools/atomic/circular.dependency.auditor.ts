import * as fs from 'node:fs';
import * as path from 'node:path';
import { aliases, projectFiles, projectRoot, read, rel } from '../core/paths';
import { result, type AuditResult, type Finding } from '../core/audit';

/**
 * Циклы между контекстами `angular/modules/<контекст>`.
 *
 * Граница модуля держится не запретом импорта, а направлением: если `menu`
 * тянет `cooking`, а `cooking` тянет `menu`, то ни один из них нельзя вынуть,
 * переписать или загрузить отдельно. Закон о границах проверяет только
 * отсутствие растворённого `core`; циклы между контекстами живут долгом,
 * который не виден при чтении одного файла.
 *
 * Рёбра строятся по разрешённым путям (алиасы из configurations/project.json
 * плюс относительные), а не по тексту спецификатора: `@modules/x` и
 * `../../x` — одно ребро.
 *
 * Перечислять все рёбра внутри цикла бесполезно: их десятки, и каждое само
 * по себе «законно». Отчёт даёт состав группы и минимальный набор рёбер,
 * разрыв которых её распускает (жадная эвристика feedback arc set).
 */

const MODULES_DIR = 'angular/modules';

function parseImports(content: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveSpecifier(specifier: string, fromFile: string): string | null {
  const root = projectRoot();
  for (const [alias, target] of Object.entries(aliases())) {
    if (!specifier.startsWith(alias + '/')) continue;
    return path.resolve(root, target + specifier.slice(alias.length));
  }
  if (specifier.startsWith('.')) return path.resolve(path.dirname(fromFile), specifier);
  return null;
}

function contextOf(absolutePath: string): string | null {
  const modulesRoot = path.resolve(projectRoot(), MODULES_DIR);
  if (!absolutePath.startsWith(modulesRoot + path.sep)) return null;
  const rest = absolutePath.slice(modulesRoot.length + 1).split(path.sep);
  return rest.length > 1 ? rest[0] : null;
}

function contextNames(): string[] {
  const modulesRoot = path.resolve(projectRoot(), MODULES_DIR);
  if (!fs.existsSync(modulesRoot)) return [];
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function collectEdges(): Map<string, Set<string>> {
  const edges = new Map<string, Set<string>>(contextNames().map((n) => [n, new Set<string>()]));
  for (const file of projectFiles(['.ts'])) {
    const from = contextOf(file);
    if (!from) continue;
    for (const specifier of parseImports(read(file))) {
      const resolved = resolveSpecifier(specifier, file);
      const to = resolved ? contextOf(resolved) : null;
      if (!to || to === from) continue;
      edges.get(from)?.add(to);
    }
  }
  return edges;
}

function strongComponents(graph: Map<string, Set<string>>): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let counter = 0;

  const visit = (node: string): void => {
    index.set(node, counter);
    low.set(node, counter);
    counter++;
    stack.push(node);
    onStack.add(node);

    for (const next of graph.get(node) ?? []) {
      if (!index.has(next)) {
        visit(next);
        low.set(node, Math.min(low.get(node)!, low.get(next)!));
      } else if (onStack.has(next)) {
        low.set(node, Math.min(low.get(node)!, index.get(next)!));
      }
    }

    if (low.get(node) === index.get(node)) {
      const component: string[] = [];
      for (;;) {
        const member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
        if (member === node) break;
      }
      components.push(component);
    }
  };

  for (const node of graph.keys()) if (!index.has(node)) visit(node);
  return components.filter((component) => component.length > 1);
}

/** Граф без одного ребра — чтобы измерить эффект его удаления. */
function without(graph: Map<string, Set<string>>, from: string, to: string): Map<string, Set<string>> {
  const copy = new Map<string, Set<string>>();
  for (const [node, targets] of graph) {
    const next = new Set(targets);
    if (node === from) next.delete(to);
    copy.set(node, next);
  }
  return copy;
}

function largestCycle(graph: Map<string, Set<string>>): number {
  const components = strongComponents(graph);
  return components.reduce((max, component) => Math.max(max, component.length), 0);
}

/**
 * Жадно убираем ребро, которое сильнее всего уменьшает крупнейшую группу.
 * Это не точный минимальный разрез (NP), но набор из 3-5 рёбер вместо
 * «здесь всё связано» — то, с чем можно работать.
 */
function minimalBreakSet(
  graph: Map<string, Set<string>>,
  component: string[],
): { from: string; to: string }[] {
  const inside = component.sort();
  let current = new Map(graph);
  const chosen: { from: string; to: string }[] = [];
  let baseline = largestCycle(current);

  while (baseline > 1) {
    let best: { from: string; to: string } | null = null;
    let bestScore = baseline;

    for (const from of inside) {
      for (const to of current.get(from) ?? []) {
        if (!inside.includes(to)) continue;
        const score = largestCycle(without(current, from, to));
        if (score < bestScore) {
          bestScore = score;
          best = { from, to };
        }
      }
    }

    if (!best) break;
    current = without(current, best.from, best.to);
    chosen.push(best);
    baseline = bestScore;
  }
  return chosen;
}

function sampleEdge(from: string, to: string): string {
  for (const file of projectFiles(['.ts'])) {
    if (contextOf(file) !== from) continue;
    for (const specifier of parseImports(read(file))) {
      const resolved = resolveSpecifier(specifier, file);
      if (resolved && contextOf(resolved) === to) return rel(file);
    }
  }
  return `${MODULES_DIR}/${from}`;
}

export function run(): AuditResult {
  const graph = collectEdges();
  const components = strongComponents(graph);
  const findings: Finding[] = [];

  for (const component of components) {
    const breakSet = minimalBreakSet(graph, component);
    const members = component.slice().sort().join(' → ');
    for (const edge of breakSet) {
      findings.push({
        file: sampleEdge(edge.from, edge.to),
        message: `группа [${members}]: разорвать ${edge.from} → ${edge.to}`,
        severity: 'critical',
        hint: 'перенести контракт в domain/ или общий модуль, чтобы зависимость стала односторонней',
      });
    }
    if (breakSet.length === 0) {
      findings.push({
        file: `${MODULES_DIR}`,
        message: `группа [${members}]: цикл без разрывающего ребра — разбирать вручную`,
        severity: 'critical',
      });
    }
  }

  const edgeCount = [...graph.values()].reduce((sum, set) => sum + set.size, 0);
  const summary = components.length
    ? `контекстов: ${graph.size}, рёбер: ${edgeCount}, циклических групп: ${components.length}, ` +
      `рёбер для разрыва: ${findings.length}`
    : `контекстов: ${graph.size}, рёбер: ${edgeCount}, циклов нет`;
  return result('circular-deps', 'Циклы между контекстами angular/modules', graph.size, findings, summary);
}
