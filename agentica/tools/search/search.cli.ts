import { ripgrepSync, ripgrepStream } from './ripgrep';

interface CliOptions {
  globs: string[];
  caseSensitive: boolean;
  fixedStrings: boolean;
  json: boolean;
  countOnly: boolean;
  targetPath: string | undefined;
}

function printHelp(): void {
  console.log(`
🔍 Поиск по коду (ripgrep / rg)
────────────────────────────────────────────────────
Использование:
  npx tsx agentica/tools/search/search.cli.ts "<pattern>" [options] [path]

Опции:
  --glob, -g <glob>      Фильтр файлов (например: "*.html" или "!*.spec.ts")
  -s, --case-sensitive   Точное совпадение регистра
  -F, --fixed            Поиск точной строки (не regex)
  --json                 Вывод в JSON-формате
  --count                Подсчет совпадений
`);
}

const FLAGS: Record<string, 'caseSensitive' | 'fixedStrings' | 'json' | 'countOnly'> = {
  '-s': 'caseSensitive',
  '--case-sensitive': 'caseSensitive',
  '-F': 'fixedStrings',
  '--fixed': 'fixedStrings',
  '--json': 'json',
  '--count': 'countOnly',
};

function parseOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    globs: [],
    caseSensitive: false,
    fixedStrings: false,
    json: false,
    countOnly: false,
    targetPath: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (arg === '--glob' || arg === '-g') {
      const glob = args[++i];
      if (glob) options.globs.push(glob);
      continue;
    }
    const flag = FLAGS[arg];
    if (flag) {
      options[flag] = true;
      continue;
    }
    if (!arg.startsWith('-')) options.targetPath = arg;
  }
  return options;
}

export async function runSearchCli(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const pattern = args[0] ?? '';
  if (!pattern) {
    printHelp();
    return;
  }
  const options = parseOptions(args.slice(1));
  const searchOptions = {
    paths: options.targetPath,
    globs: options.globs,
    caseSensitive: options.caseSensitive,
    fixedStrings: options.fixedStrings,
  };

  if (options.json) {
    console.log(JSON.stringify(ripgrepSync(pattern, searchOptions), null, 2));
    return;
  }
  if (options.countOnly) {
    console.log(`Совпадений: ${ripgrepSync(pattern, searchOptions).length}`);
    return;
  }
  await ripgrepStream(pattern, searchOptions);
}

if (process.argv[1]?.endsWith('search.cli.ts')) {
  runSearchCli(process.argv.slice(2));
}
