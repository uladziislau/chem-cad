import ts from 'typescript';

export interface LocatedSymbol {
  position: number;
  line: number;
  column: number;
  name: string;
  kind: string;
}

/** Найти объявления идентификатора с указанным именем в файле. */
export function locateSymbol(sourceFile: ts.SourceFile, name: string): LocatedSymbol[] {
  const found: LocatedSymbol[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === name && isDeclarationName(node)) {
      const start = node.getStart(sourceFile);
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
      found.push({
        position: start,
        line: line + 1,
        column: character + 1,
        name,
        kind: ts.SyntaxKind[node.parent.kind] ?? 'Unknown',
      });
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

function isDeclarationName(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if ((parent as ts.NamedDeclaration).name !== node) return false;

  return (
    ts.isFunctionDeclaration(parent) ||
    ts.isClassDeclaration(parent) ||
    ts.isInterfaceDeclaration(parent) ||
    ts.isTypeAliasDeclaration(parent) ||
    ts.isEnumDeclaration(parent) ||
    ts.isEnumMember(parent) ||
    ts.isVariableDeclaration(parent) ||
    ts.isMethodDeclaration(parent) ||
    ts.isPropertyDeclaration(parent) ||
    ts.isPropertySignature(parent) ||
    ts.isParameter(parent) ||
    ts.isModuleDeclaration(parent) ||
    ts.isImportSpecifier(parent) ||
    ts.isExportSpecifier(parent) ||
    ts.isGetAccessorDeclaration(parent) ||
    ts.isSetAccessorDeclaration(parent)
  );
}
