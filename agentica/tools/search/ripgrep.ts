import { spawn, spawnSync } from 'node:child_process';

/**
 * Путь к ripgrep: системный `rg` из PATH (brew/apt).
 * Зависимость @vscode/ripgrep убрана — бинарник и так есть на dev-машинах и CI.
 */
const rgPath = 'rg';

export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  text: string;
  submatches?: { match: string; start: number; end: number }[];
}

export interface SearchOptions {
  /** Корневая директория или список путей для поиска */
  paths?: string | string[];
  /** Glob паттерны включения, например ['*.ts', '*.html'] */
  globs?: string[];
  /** Учитывать регистр (по умолчанию smart-case) */
  caseSensitive?: boolean;
  /** Поиск как фиксированная строка, а не regex */
  fixedStrings?: boolean;
  /** Инвертировать условие поиска */
  invert?: boolean;
  /** Максимальное количество совпадений */
  maxCount?: number;
  /** Дополнительные флаги rg */
  extraArgs?: string[];
}

/**
 * Синхронный поиск с использованием бинарника ripgrep
 */
export function ripgrepSync(pattern: string, options: SearchOptions = {}): SearchMatch[] {
  const args = buildArgs(pattern, { ...options, json: true });
  const result = spawnSync(rgPath, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

  if (!result.stdout) {
    return [];
  }

  const matches: SearchMatch[] = [];
  const lines = result.stdout.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.type === 'match') {
        const payload = data.data;
        matches.push({
          file: payload.path.text.replace(/\\/g, '/'),
          line: payload.line_number,
          column: payload.submatches?.[0]?.start ?? 1,
          text: payload.lines.text.trimEnd(),
          submatches: payload.submatches?.map((s: { match: { text: string }; start: number; end: number }) => ({
            match: s.match.text,
            start: s.start,
            end: s.end,
          })),
        });
      }
    } catch {
      // Игнорируем не-JSON строки
    }
  }

  return matches;
}

/**
 * Быстрый подсчет совпадений
 */
export function ripgrepCountSync(pattern: string, options: SearchOptions = {}): number {
  const matches = ripgrepSync(pattern, options);
  return matches.length;
}

/**
 * Запуск ripgrep напрямую в stdout (для CLI)
 */
export function ripgrepStream(pattern: string, options: SearchOptions = {}): Promise<number> {
  return new Promise((resolve) => {
    const args = buildArgs(pattern, options);
    const child = spawn(rgPath, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      resolve(code ?? 0);
    });
  });
}

function buildArgs(pattern: string, options: SearchOptions & { json?: boolean }): string[] {
  const args: string[] = [];

  if (options.json) {
    args.push('--json');
  } else {
    args.push('--color=always', '--heading', '--line-number');
  }

  if (options.caseSensitive) {
    args.push('--case-sensitive');
  } else {
    args.push('--smart-case');
  }

  if (options.fixedStrings) {
    args.push('--fixed-strings');
  }

  if (options.invert) {
    args.push('--invert-match');
  }

  if (options.maxCount) {
    args.push('--max-count', String(options.maxCount));
  }

  if (options.globs) {
    for (const glob of options.globs) {
      args.push('--glob', glob);
    }
  }

  // Всегда исключаем служебные папки
  args.push('--glob', '!**/node_modules/**');
  args.push('--glob', '!**/dist/**');
  args.push('--glob', '!**/.angular/**');
  args.push('--glob', '!**/.git/**');

  if (options.extraArgs) {
    args.push(...options.extraArgs);
  }

  args.push(pattern);

  if (options.paths) {
    if (Array.isArray(options.paths)) {
      args.push(...options.paths);
    } else {
      args.push(options.paths);
    }
  } else {
    args.push('.');
  }

  return args;
}
