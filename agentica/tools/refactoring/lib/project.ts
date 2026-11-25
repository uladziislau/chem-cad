import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * Обёртка над TypeScript Compiler API: проект, языковой сервис, правки.
 * Работает на `typescript` самого проекта, без дополнительных зависимостей.
 */

export interface ChangedFile {
  file: string;
  before: string;
  after: string;
}

export interface ProjectOptions {
  /** Корень проекта. По умолчанию ищется вверх от cwd. */
  root?: string;
  /** Явный путь к tsconfig.json. */
  tsconfig?: string;
}

export function assertCompilerApi(): void {
  if (typeof (ts as unknown as { createLanguageService?: unknown }).createLanguageService !== 'function') {
    throw new Error(
      `TypeScript ${ts.version} не содержит compiler API (нативный порт TS 7).\n` +
        'Поставь зависимости проекта (bun install / npm ci), чтобы использовался typescript 5/6, ' +
        'или поставь ts-morph: bun add -d ts-morph',
    );
  }
}

export function findTsConfig(start: string): string {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, 'tsconfig.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`tsconfig.json не найден выше ${start}`);
    dir = parent;
  }
}

/** Применить TextChange[] к тексту (правки применяются с конца). */
export function applyChanges(text: string, changes: readonly ts.TextChange[]): string {
  const sorted = [...changes].sort((a, b) => b.span.start - a.span.start);
  let next = text;
  for (const change of sorted) {
    next = next.slice(0, change.span.start) + change.newText + next.slice(change.span.start + change.span.length);
  }
  return next;
}

export class Project {
  readonly root: string;
  readonly tsconfigPath: string;
  readonly parsed: ts.ParsedCommandLine;
  readonly service: ts.LanguageService;

  private readonly overrides = new Map<string, { version: number; text: string }>();
  private readonly diskVersions = new Map<string, string>();
  private readonly changed = new Map<string, ChangedFile>();

  constructor(options: ProjectOptions = {}) {
    assertCompilerApi();

    this.tsconfigPath = path.resolve(options.tsconfig ?? findTsConfig(options.root ?? process.cwd()));
    this.root = options.root ? path.resolve(options.root) : path.dirname(this.tsconfigPath);

    const read = ts.readConfigFile(this.tsconfigPath, ts.sys.readFile);
    if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));

    this.parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, this.root, undefined, this.tsconfigPath);
    if (this.parsed.errors.length) {
      const text = this.parsed.errors.map((e) => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n');
      throw new Error(text);
    }

    this.service = ts.createLanguageService(this.host(), ts.createDocumentRegistry());
  }

  private host(): ts.LanguageServiceHost {
    return {
      getScriptFileNames: () => this.parsed.fileNames,
      getScriptVersion: (fileName) => {
        const override = this.overrides.get(this.key(fileName));
        if (override) return `mem-${override.version}`;
        return this.diskVersion(fileName);
      },
      getScriptSnapshot: (fileName) => {
        const override = this.overrides.get(this.key(fileName));
        if (override) return ts.ScriptSnapshot.fromString(override.text);
        if (!fs.existsSync(fileName)) return undefined;
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName, 'utf8'));
      },
      getCurrentDirectory: () => this.root,
      getCompilationSettings: () => this.parsed.options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
      useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    };
  }

  private key(fileName: string): string {
    const resolved = path.resolve(fileName);
    return ts.sys.useCaseSensitiveFileNames ? resolved : resolved.toLowerCase();
  }

  private diskVersion(fileName: string): string {
    const key = this.key(fileName);
    const known = this.diskVersions.get(key);
    if (known) return known;
    try {
      const stat = fs.statSync(fileName);
      const version = `${stat.mtimeMs}:${stat.size}`;
      this.diskVersions.set(key, version);
      return version;
    } catch {
      return 'missing';
    }
  }

  /** Абсолютный путь внутри проекта. */
  resolve(file: string): string {
    return path.resolve(this.root, file);
  }

  /** Путь относительно корня проекта, для вывода. */
  relative(file: string): string {
    return path.relative(this.root, file) || file;
  }

  text(file: string): string {
    const abs = path.resolve(file);
    const override = this.overrides.get(this.key(abs));
    if (override) return override.text;
    return fs.readFileSync(abs, 'utf8');
  }

  /** Изменение в памяти: попадёт на диск только в save(). */
  update(file: string, text: string): void {
    const abs = path.resolve(file);
    const key = this.key(abs);
    const before = this.changed.get(key)?.before ?? this.text(abs);
    const previous = this.overrides.get(key);
    this.overrides.set(key, { version: (previous?.version ?? 0) + 1, text });
    this.changed.set(key, { file: abs, before, after: text });
  }

  /** Применить TextChange[] (как из языкового сервиса) к файлу. */
  applyTextChanges(file: string, changes: readonly ts.TextChange[]): void {
    if (!changes.length) return;
    this.update(file, applyChanges(this.text(file), changes));
  }

  get changedFiles(): ChangedFile[] {
    return [...this.changed.values()];
  }

  /** Записать все накопленные изменения на диск. */
  save(): ChangedFile[] {
    const files = this.changedFiles;
    for (const change of files) {
      fs.mkdirSync(path.dirname(change.file), { recursive: true });
      fs.writeFileSync(change.file, change.after, 'utf8');
      this.diskVersions.delete(this.key(change.file));
    }
    this.changed.clear();
    this.overrides.clear();
    return files;
  }
}
