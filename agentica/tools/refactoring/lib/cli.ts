/** Разбор аргументов и вывод изменений: общее для инструментов refactoring/. */

export interface Args {
  flags: Set<string>;
  values: Map<string, string>;
  positional: string[];
}

export function parseArgs(argv: string[]): Args {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq > 0) {
        values.set(arg.slice(0, eq), arg.slice(eq + 1));
        continue;
      }
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        values.set(arg, next);
        i++;
      } else {
        flags.add(arg);
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      flags.add(arg);
    } else {
      positional.push(arg);
    }
  }

  return { flags, values, positional };
}

export function requireValue(args: Args, name: string): string {
  const value = args.values.get(name);
  if (!value) fail(`Не указан обязательный параметр ${name}`);
  return value;
}

export function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

interface DiffLine {
  type: ' ' | '-' | '+';
  text: string;
}

/** Линейный diff через LCS; при больших файлах откатывается на префикс/суффикс. */
function diffLines(before: string[], after: string[]): DiffLine[] {
  const n = before.length;
  const m = after.length;

  if (n * m > 4_000_000) {
    let start = 0;
    while (start < n && start < m && before[start] === after[start]) start++;
    let endA = n - 1;
    let endB = m - 1;
    while (endA >= start && endB >= start && before[endA] === after[endB]) {
      endA--;
      endB--;
    }
    return [
      ...before.slice(0, start).map((text) => ({ type: ' ' as const, text })),
      ...before.slice(start, endA + 1).map((text) => ({ type: '-' as const, text })),
      ...after.slice(start, endB + 1).map((text) => ({ type: '+' as const, text })),
      ...before.slice(endA + 1).map((text) => ({ type: ' ' as const, text })),
    ];
  }

  const table: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = before[i] === after[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      result.push({ type: ' ', text: before[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ type: '-', text: before[i] });
      i++;
    } else {
      result.push({ type: '+', text: after[j] });
      j++;
    }
  }
  while (i < n) result.push({ type: '-', text: before[i++] });
  while (j < m) result.push({ type: '+', text: after[j++] });
  return result;
}

/** Компактный diff: только изменённые участки с контекстом. */
export function printChange(file: string, before: string, after: string, context = 3, maxLines = 60): void {
  const diff = diffLines(before.split('\n'), after.split('\n'));
  const interesting = diff.map((line, index) => (line.type === ' ' ? -1 : index)).filter((index) => index >= 0);

  console.log(`  ${file}`);
  if (!interesting.length) {
    console.log('  (без изменений)');
    return;
  }

  const keep = new Set<number>();
  for (const index of interesting) {
    for (let offset = -context; offset <= context; offset++) {
      const target = index + offset;
      if (target >= 0 && target < diff.length) keep.add(target);
    }
  }

  const indices = [...keep].sort((a, b) => a - b);
  let printed = 0;
  let previous = -1;

  for (const index of indices) {
    if (printed >= maxLines) {
      console.log(`  … ещё ${indices.length - printed} строк(и)`);
      return;
    }
    if (previous >= 0 && index > previous + 1) console.log('  …');
    const line = diff[index];
    console.log(`  ${line.type} ${line.text}`);
    previous = index;
    printed++;
  }
}
