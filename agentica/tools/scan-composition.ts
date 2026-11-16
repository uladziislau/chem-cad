#!/usr/bin/env tsx
/**
 * scan-composition.ts — сканер CompositionEntry: проекция структуры проекта.
 *
 * Обходит MODULE_ROOTS / angular/modules / UI_ROOT / DATA_ROOT и собирает
 * реестр элементов состава (kind: module | angular-module | page | component |
 * service | data | route). Результат мержится с существующим
 * composition.data.json: запись считается той же по `path`, а при переносе
 * каталога — по `id`; id, specIds, taskIds и прочие ручные аннотации
 * сохраняются; lastSeenAt обновляется только у найденных записей —
 * устаревшие остаются маркерами мёртвых элементов.
 *
 * Запуск:  pnpm exec tsx agentica/tools/scan-composition.ts [--check|--stdout]
 *   --check    exit 1, если файл устарел (для гейтов)
 *   --stdout   печатать JSON вместо записи
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';

// ── Конфигурация проекта ──────────────────────────────────────────────
const ROOT = resolve(import.meta.dirname, '..', '..');
const MODULE_ROOTS = ['modules']; // прямые дети-каталоги → kind 'module'
const ANGULAR_MODULES = 'angular/modules'; // прямые дети → 'angular-module'
const UI_ROOT = 'angular'; // обход ui-файлов (page/component/service/route/data)
const DATA_ROOT = 'data'; // дети → 'data'
const OUT_JSON = resolve(ROOT, 'modules', 'development', 'data', 'composition.data.json');

// ── Типы (зеркало domain/composition.model.ts) ────────────────────────
type CompositionKind =
  | 'module'
  | 'angular-module'
  | 'page'
  | 'component'
  | 'service'
  | 'data'
  | 'route';

interface ScannedEntry {
  id: string;
  kind: CompositionKind;
  name: string;
  path: string;
  ownerModule?: string;
  lastSeenAt: string;
}

type ExistingEntry = Record<string, unknown> & { id?: string; path?: string; kind?: string };
type IdFactory = (kind: CompositionKind, slug: string) => string;

const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-app', '.git', 'coverage', 'test-results', '.angular']);
const SKIP_FILES = /\.(spec|test|d)\.ts$|\.config\.(ts|js|mjs|cjs)$/;
const KIND_ORDER: Record<CompositionKind, number> = {
  module: 0,
  'angular-module': 1,
  page: 2,
  component: 3,
  service: 4,
  data: 5,
  route: 6,
};
const PREFIX: Record<CompositionKind, string> = {
  module: 'mod',
  'angular-module': 'amod',
  page: 'page',
  component: 'cmp',
  service: 'svc',
  data: 'data',
  route: 'route',
};
const today = new Date().toISOString().slice(0, 10);

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(p);
    } else if (/\.(ts|json)$/.test(e.name) && !SKIP_FILES.test(e.name)) {
      yield p;
    }
  }
}

function kebab(s: string): string {
  return s
    .replace(/\.(data\.)?(ts|json)$/, '')
    .split('.')
    .filter((t) => !['ui', 'page', 'component', 'service', 'store', 'data', 'routes', 'spec', 'test'].includes(t))
    .join('-')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function classify(rel: string, base: string): CompositionKind | null {
  if (base.endsWith('.routes.ts')) return 'route';
  if (/\.data\.(ts|json)$/.test(base)) return 'data';
  if (/\.(ui\.page|page)\.ts$/.test(base) || /(^|\/)pages\//.test(rel)) return 'page';
  if (base.endsWith('.component.ts')) return 'component';
  if (/\.(service|store)\.ts$/.test(base)) return 'service';
  return null;
}

function makeIdFactory(): IdFactory {
  const used = new Set<string>();
  return (kind: CompositionKind, slug: string): string => {
    const base = `${PREFIX[kind]}-${slug}`.replace(/-+/g, '-').replace(/-$/, '');
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
}

function scanModuleRoots(uniqueId: IdFactory): {
  entries: ScannedEntry[];
  moduleIds: Map<string, string>;
} {
  const entries: ScannedEntry[] = [];
  const moduleIds = new Map<string, string>();
  for (const root of MODULE_ROOTS) {
    const abs = join(ROOT, root);
    if (!existsSync(abs)) continue;
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
      const id = uniqueId('module', e.name);
      moduleIds.set(e.name, id);
      entries.push({ id, kind: 'module', name: e.name, path: `${root}/${e.name}`, lastSeenAt: today });
      const modAbs = join(abs, e.name);
      for (const f of walk(modAbs)) {
        if (!/\.data\.(ts|json)$/.test(basename(f))) continue;
        const rel = relative(modAbs, f).split(sep).join('/');
        entries.push({
          id: uniqueId('data', kebab(basename(f)) || e.name),
          kind: 'data',
          name: basename(f).replace(/\.data\.(ts|json)$/, ''),
          path: `${root}/${e.name}/${rel}`,
          ownerModule: id,
          lastSeenAt: today,
        });
      }
    }
  }
  return { entries, moduleIds };
}

function scanAngularModules(
  uniqueId: IdFactory,
  moduleIds: Map<string, string>,
): { entries: ScannedEntry[]; amodIds: Map<string, string> } {
  const entries: ScannedEntry[] = [];
  const amodIds = new Map<string, string>();
  const amodAbs = join(ROOT, ANGULAR_MODULES);
  if (!existsSync(amodAbs)) return { entries, amodIds };
  for (const e of readdirSync(amodAbs, { withFileTypes: true })) {
    if (!e.isDirectory() || SKIP_DIRS.has(e.name)) continue;
    const id = uniqueId('angular-module', e.name);
    amodIds.set(e.name, id);
    entries.push({
      id,
      kind: 'angular-module',
      name: e.name,
      path: `${ANGULAR_MODULES}/${e.name}`,
      ...(moduleIds.has(e.name) ? { ownerModule: moduleIds.get(e.name) } : {}),
      lastSeenAt: today,
    });
  }
  return { entries, amodIds };
}

function scanUiFiles(uniqueId: IdFactory, amodIds: Map<string, string>): ScannedEntry[] {
  const entries: ScannedEntry[] = [];
  const uiAbs = join(ROOT, UI_ROOT);
  if (!existsSync(uiAbs)) return entries;
  for (const f of walk(uiAbs)) {
    const rel = relative(ROOT, f).split(sep).join('/');
    const base = basename(f);
    const kind = classify(rel, base);
    if (!kind) continue;
    const parts = rel.split('/');
    const ownerModule =
      parts[0] === 'angular' && parts[1] === 'modules' && parts[2] ? amodIds.get(parts[2]) : undefined;
    entries.push({
      id: uniqueId(kind, kebab(base) || kebab(parts[parts.length - 2] ?? 'index')),
      kind,
      name: base.replace(/\.(ts|json)$/, ''),
      path: rel,
      ...(ownerModule ? { ownerModule } : {}),
      lastSeenAt: today,
    });
  }
  return entries;
}

function scanDataRoot(uniqueId: IdFactory): ScannedEntry[] {
  const entries: ScannedEntry[] = [];
  const dataAbs = join(ROOT, DATA_ROOT);
  if (!existsSync(dataAbs)) return entries;
  for (const e of readdirSync(dataAbs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const isDataFile =
      e.isFile() && e.name.endsWith('.json') && !['package.json', 'tsconfig.json'].includes(e.name);
    if (!e.isDirectory() && !isDataFile) continue;
    entries.push({
      id: uniqueId('data', kebab(e.name) || 'index'),
      kind: 'data',
      name: e.name,
      path: `${DATA_ROOT}/${e.name}`,
      lastSeenAt: today,
    });
  }
  return entries;
}

function loadExisting(): ExistingEntry[] {
  if (!existsSync(OUT_JSON)) return [];
  return JSON.parse(readFileSync(OUT_JSON, 'utf-8')) as ExistingEntry[];
}

function mergeWithExisting(scanned: ScannedEntry[], existing: ExistingEntry[]): ExistingEntry[] {
  const byPath = new Map(existing.map((e) => [e.path, e]));
  const byId = new Map(existing.map((e) => [e.id, e]));
  const consumed = new Set<ExistingEntry>();
  const merged: ExistingEntry[] = scanned.map((s) => {
    const old = byPath.get(s.path) ?? byId.get(s.id);
    if (!old || consumed.has(old)) return { ...s };
    consumed.add(old);
    return { ...old, ...s, id: old.id };
  });
  for (const e of existing) {
    if (!consumed.has(e)) merged.push(e); // stale: lastSeenAt остаётся старым
  }
  return merged;
}

function sortEntries(entries: ExistingEntry[]): ExistingEntry[] {
  return entries.sort((a, b) => {
    const ka = KIND_ORDER[a.kind as CompositionKind] ?? 99;
    const kb = KIND_ORDER[b.kind as CompositionKind] ?? 99;
    return ka - kb || String(a.path).localeCompare(String(b.path));
  });
}

function dedupeById(entries: ExistingEntry[]): ExistingEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const id = String(e.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function main() {
  const existing = loadExisting();
  const uniqueId = makeIdFactory();
  const { entries: modEntries, moduleIds } = scanModuleRoots(uniqueId);
  const { entries: amodEntries, amodIds } = scanAngularModules(uniqueId, moduleIds);
  const scanned = [
    ...modEntries,
    ...amodEntries,
    ...scanUiFiles(uniqueId, amodIds),
    ...scanDataRoot(uniqueId),
  ];
  const merged = sortEntries(dedupeById(mergeWithExisting(scanned, existing)));
  const json = JSON.stringify(merged, null, 2) + '\n';
  const args = process.argv.slice(2);

  if (args.includes('--stdout')) {
    process.stdout.write(json);
    return;
  }
  if (args.includes('--check')) {
    const current = existsSync(OUT_JSON) ? readFileSync(OUT_JSON, 'utf-8') : '';
    if (current !== json) {
      console.error(`scan-composition: ${relative(ROOT, OUT_JSON)} устарел — запустите сканер`);
      process.exit(1);
    }
    console.log('scan-composition: composition.data.json актуален');
    return;
  }
  writeFileSync(OUT_JSON, json);
  const counts = merged.reduce<Record<string, number>>((acc, e) => {
    const k = String(e.kind);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`scan-composition: ${merged.length} записей → ${relative(ROOT, OUT_JSON)}`, counts);
}

main();
