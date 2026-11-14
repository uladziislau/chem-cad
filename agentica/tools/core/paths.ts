import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Единственное место, где инструменты агента узнают пути проекта.
 * Корни, расширения, исключения и алиасы живут в configurations/project.json;
 * в коде инструментов абсолютных путей проекта нет.
 */

export interface ProjectConfig {
  name?: string;
  roots?: string[];
  extensions?: string[];
  skipDirs?: string[];
  aliases?: Record<string, string>;
}

const DEFAULT_ROOTS = ['angular'];
const DEFAULT_EXTENSIONS = ['.ts'];
const DEFAULT_SKIP = ['node_modules', 'dist', '.angular', 'out-tsc', 'build', '.git'];

function agenticaDir(): string {
  return path.resolve(import.meta.dirname, '..', '..');
}

const CONFIG_PATH = path.resolve(agenticaDir(), 'tools', 'configurations', 'project.json');

export function projectRoot(): string {
  return path.resolve(agenticaDir(), '..');
}

export function loadConfig(): ProjectConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as ProjectConfig;
  } catch {
    return { roots: DEFAULT_ROOTS, extensions: DEFAULT_EXTENSIONS };
  }
}

export function aliases(): Record<string, string> {
  return loadConfig().aliases ?? {};
}

/** Путь от корня проекта — так его видят отчёты и человек. */
export function rel(file: string): string {
  return path.relative(projectRoot(), file).split(path.sep).join('/');
}

export function abs(file: string): string {
  return path.isAbsolute(file) ? file : path.resolve(projectRoot(), file);
}

export function walkFiles(
  dir: string,
  extensions: string[],
  skipDirs: Set<string>,
  out: string[] = [],
): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (skipDirs.has(entry)) continue;
      walkFiles(full, extensions, skipDirs, out);
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

/** Все файлы проекта по корням из конфигурации. */
export function projectFiles(extensions?: string[]): string[] {
  const config = loadConfig();
  const exts = extensions ?? config.extensions ?? DEFAULT_EXTENSIONS;
  const skip = new Set(config.skipDirs ?? DEFAULT_SKIP);
  const out: string[] = [];
  for (const root of config.roots ?? DEFAULT_ROOTS) {
    walkFiles(path.resolve(projectRoot(), root), exts, skip, out);
  }
  return out;
}

export function read(file: string): string {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

export function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(read(file)) as T;
  } catch {
    return null;
  }
}
