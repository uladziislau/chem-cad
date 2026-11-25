import ts from 'typescript';
import type { Args } from './cli';
import { fail, requireValue } from './cli';
import type { Project } from './project';
import { locateSymbol } from './symbols';

export interface ResolvedPosition {
  file: string;
  fileArg: string;
  position: number;
}

/**
 * Позиция символа из аргументов: либо --line/--col, либо --symbol
 * (первое объявление в файле, если не указан --first и объявление одно).
 */
export function resolvePosition(project: Project, args: Args): ResolvedPosition {
  const fileArg = requireValue(args, '--file');
  const file = project.resolve(fileArg);
  const sourceFile = ts.createSourceFile(file, project.text(file), ts.ScriptTarget.Latest, true);

  const line = args.values.get('--line');
  const col = args.values.get('--col');
  if (line && col) {
    return { file, fileArg, position: sourceFile.getPositionOfLineAndCharacter(Number(line) - 1, Number(col) - 1) };
  }

  const symbol = requireValue(args, '--symbol');
  const found = locateSymbol(sourceFile, symbol);
  if (!found.length) fail(`Объявление '${symbol}' не найдено в ${fileArg}`);
  if (found.length > 1 && !args.flags.has('--first')) {
    console.log(`Найдено несколько объявлений '${symbol}':`);
    for (const item of found) console.log(`  ${fileArg}:${item.line}:${item.column}  ${item.kind}`);
    fail('Уточни через --line/--col или добавь --first');
  }

  return { file, fileArg, position: found[0].position };
}
