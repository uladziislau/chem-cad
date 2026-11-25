import './lib/preflight';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { applyChanges } from './lib/project';
import { parseArgs } from './lib/cli';
import { openProject } from './lib/open';

const HELP = `
Разбор Angular-компонентов: inline template/styles → отдельные .html/.css файлы.

Использование:
  bun agentica/tools/refactoring/extract-component-parts.ts [--write] [--check] [--json]

Опции:
  --write            Создать .html/.css и заменить template/styles на templateUrl/styleUrls
  --check            Код возврата 1, если остались inline template/styles (для CI)
  --json             Вывод в JSON
  --root <dir>       Корень проекта
  --tsconfig <path>  Явный tsconfig.json (по умолчанию tsconfig.json проекта)
`;

type PartKind = 'inline' | 'external' | 'none' | 'skip';

interface ComponentInfo {
  file: string;
  className: string;
  template: PartKind;
  styles: PartKind;
}

const args = parseArgs(process.argv.slice(2));
if (args.flags.has('--help') || args.flags.has('-h')) {
  console.log(HELP.trim());
  process.exit(0);
}

const project = openProject(args);
const write = args.flags.has('--write');
const check = args.flags.has('--check');

const results: ComponentInfo[] = [];
const edits = new Map<string, ts.TextChange[]>();
const newFiles = new Map<string, string>();

for (const fileName of project.parsed.fileNames) {
  if (!/\.tsx?$/.test(fileName)) continue;
  if (/\.d\.ts$|\.spec\.ts$|\.test\.ts$/.test(fileName)) continue;

  const text = fs.readFileSync(fileName, 'utf8');
  if (!text.includes('@Component')) continue;

  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const fileEdits: ts.TextChange[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node)) inspectClass(node, sourceFile, fileName, fileEdits);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (fileEdits.length) edits.set(fileName, fileEdits);
}

if (write) {
  for (const [fileName, changes] of edits) {
    fs.writeFileSync(fileName, applyChanges(project.text(fileName), changes), 'utf8');
  }
  for (const [fileName, content] of newFiles) {
    fs.mkdirSync(path.dirname(fileName), { recursive: true });
    fs.writeFileSync(fileName, content, 'utf8');
  }
}

if (args.flags.has('--json')) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const item of results) {
    console.log(`${item.file}  ${item.className}  template=${item.template}  styles=${item.styles}`);
  }
  const inline = results.filter((r) => r.template === 'inline' || r.styles === 'inline');
  console.log(`\nКомпонентов: ${results.length}, с inline-частями: ${inline.length}`);
  if (!write && inline.length) console.log('Предпросмотр. Применить: --write');
  if (write) console.log('✅ Готово. Проверь: bunx tsc --noEmit');
}

if (check && results.some((r) => r.template === 'inline' || r.styles === 'inline')) process.exit(1);

function inspectClass(
  node: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
  fileName: string,
  fileEdits: ts.TextChange[],
): void {
  const call = componentCall(node);
  if (!call || !call.arguments.length) return;

  const arg = call.arguments[0];
  if (!ts.isObjectLiteralExpression(arg)) return;

  const base = fileName.replace(/\.tsx?$/, '');
  const baseName = path.basename(base);
  const dir = path.dirname(fileName);

  let templateKind: PartKind = 'none';
  let stylesKind: PartKind = 'none';

  const template = findProperty(arg, 'template');
  const templateUrl = findProperty(arg, 'templateUrl');

  if (template) {
    const value = literalText(template.initializer);
    if (value === undefined) {
      warn(`${project.relative(fileName)}: template не является простым литералом, пропускаю`);
      templateKind = 'skip';
    } else {
      const target = path.join(dir, `${baseName}.html`);
      if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') !== value) {
        warn(`${project.relative(target)} уже существует с другим содержимым, пропускаю`);
        templateKind = 'skip';
      } else {
        newFiles.set(target, withTrailingNewline(value));
        fileEdits.push(replaceNode(sourceFile, template, `templateUrl: './${baseName}.html'`));
        templateKind = 'inline';
      }
    }
  } else if (templateUrl) {
    templateKind = 'external';
  }

  const styles = findProperty(arg, 'styles');
  const styleUrls = findProperty(arg, 'styleUrls') ?? findProperty(arg, 'styleUrl');

  if (styles) {
    const values = styleTexts(styles.initializer);
    if (values === undefined) {
      warn(`${project.relative(fileName)}: styles содержат выражение, пропускаю`);
      stylesKind = 'skip';
    } else {
      const target = path.join(dir, `${baseName}.css`);
      const content = values.join('\n\n');
      if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') !== content) {
        warn(`${project.relative(target)} уже существует с другим содержимым, пропускаю`);
        stylesKind = 'skip';
      } else {
        newFiles.set(target, withTrailingNewline(content));
        fileEdits.push(replaceNode(sourceFile, styles, `styleUrls: ['./${baseName}.css']`));
        stylesKind = 'inline';
      }
    }
  } else if (styleUrls) {
    stylesKind = 'external';
  }

  results.push({
    file: project.relative(fileName),
    className: node.name?.text ?? '(anonymous)',
    template: templateKind,
    styles: stylesKind,
  });
}

function componentCall(node: ts.ClassDeclaration): ts.CallExpression | undefined {
  for (const decorator of decoratorsOf(node)) {
    const expression = decorator.expression;
    if (!ts.isCallExpression(expression)) continue;
    const callee = expression.expression;
    const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
    if (name === 'Component') return expression;
  }
  return undefined;
}

function decoratorsOf(node: ts.ClassDeclaration): readonly ts.Decorator[] {
  const api = ts as unknown as {
    canHaveDecorators?: (node: ts.Node) => boolean;
    getDecorators?: (node: ts.Node) => readonly ts.Decorator[] | undefined;
  };
  if (api.canHaveDecorators && api.getDecorators && api.canHaveDecorators(node)) {
    return api.getDecorators(node) ?? [];
  }
  return (node as unknown as { decorators?: readonly ts.Decorator[] }).decorators ?? [];
}

function findProperty(object: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | undefined {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : undefined;
    if (key === name) return property;
  }
  return undefined;
}

function literalText(node: ts.Expression): string | undefined {
  if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isStringLiteral(node)) return node.text;
  return undefined;
}

function styleTexts(node: ts.Expression): string[] | undefined {
  if (ts.isArrayLiteralExpression(node)) {
    const values: string[] = [];
    for (const element of node.elements) {
      const value = literalText(element);
      if (value === undefined) return undefined;
      values.push(value);
    }
    return values;
  }
  const single = literalText(node);
  return single === undefined ? undefined : [single];
}

function replaceNode(sourceFile: ts.SourceFile, node: ts.Node, newText: string): ts.TextChange {
  const start = node.getStart(sourceFile);
  return { span: { start, length: node.getEnd() - start }, newText };
}

function warn(message: string): void {
  console.error(`⚠️  ${message}`);
}

function withTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text : `${text}\n`;
}
