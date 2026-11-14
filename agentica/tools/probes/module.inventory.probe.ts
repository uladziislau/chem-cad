import * as fs from 'node:fs';
import * as path from 'node:path';
import { projectRoot, read, rel } from '../core/paths';

/**
 * Инвентарь модулей: сколько в каждом файлов, строк, компонентов, сервисов
 * и тестов.
 *
 * Probe без вердикта — цифры для решения: где модуль вырос в отдельный
 * контекст, а где держится на одном компоненте. Лимиты размера проверяет
 * oxlint; здесь важен состав, а не порог.
 */

interface ModuleRow {
  name: string;
  files: number;
  lines: number;
  components: number;
  services: number;
  facades: number;
  tests: number;
}

const MODULES_DIR = 'angular/modules';
const IS_TEST = /[\\/]tests?[\\/]|\.(spec|test)\.ts$/;

function collect(root: string): ModuleRow[] {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const row: ModuleRow = {
        name: entry.name,
        files: 0,
        lines: 0,
        components: 0,
        services: 0,
        facades: 0,
        tests: 0,
      };
      const walk = (dir: string): void => {
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, item.name);
          if (item.isDirectory()) {
            if (item.name === 'node_modules') continue;
            walk(full);
            continue;
          }
          if (!item.name.endsWith('.ts')) continue;
          if (IS_TEST.test(full)) {
            row.tests++;
            continue;
          }
          row.files++;
          const content = read(full);
          row.lines += content.split('\n').length;
          if (/@Component\s*\(/.test(content)) row.components++;
          if (/@Injectable\s*\(/.test(content)) {
            row.services++;
            if (full.endsWith('.facade.ts')) row.facades++;
          }
        }
      };
      walk(path.join(root, entry.name));
      return row;
    })
    .sort((a, b) => b.lines - a.lines);
}

export function run(): void {
  const root = path.resolve(projectRoot(), MODULES_DIR);
  if (!fs.existsSync(root)) {
    console.log('Нет каталога angular/modules — миграция к эталону не завершена.');
    return;
  }
  const rows = collect(root);

  const total = rows.reduce(
    (sum, row) => ({
      files: sum.files + row.files,
      lines: sum.lines + row.lines,
      components: sum.components + row.components,
      services: sum.services + row.services,
      facades: sum.facades + row.facades,
      tests: sum.tests + row.tests,
    }),
    { files: 0, lines: 0, components: 0, services: 0, facades: 0, tests: 0 },
  );

  console.log('модуль'.padEnd(24) + 'файлы  строки  комп.  серв.  фасады  тесты');
  for (const row of rows) {
    console.log(
      row.name.padEnd(24) +
        String(row.files).padEnd(7) +
        String(row.lines).padEnd(8) +
        String(row.components).padEnd(7) +
        String(row.services).padEnd(7) +
        String(row.facades).padEnd(8) +
        String(row.tests),
    );
  }
  console.log(
    '\nвсего'.padEnd(24) +
      String(total.files).padEnd(7) +
      String(total.lines).padEnd(8) +
      String(total.components).padEnd(7) +
      String(total.services).padEnd(7) +
      String(total.facades).padEnd(8) +
      String(total.tests),
  );

  const biggest = rows[0];
  const thin = rows.filter((row) => row.files <= 2).map((row) => row.name);
  console.log(`\nКрупнейший: ${biggest?.name} (${biggest?.lines} строк)`);
  console.log(`На 2 файла и меньше: ${thin.length ? thin.join(', ') : '—'}`);
  console.log(`Тестов на модуль: ${(total.tests / rows.length).toFixed(1)} в среднем`);
  console.log(`Корень: ${rel(root)}`);
}
