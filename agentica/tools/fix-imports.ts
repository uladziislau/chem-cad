import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

let config: { roots?: string[]; extensions?: string[]; skipDirs?: string[] } = {};
try {
    const cfgPath = path.join(projectRoot, 'agentica', 'tools', 'configurations', 'project.json');
    config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
} catch {
    config = {};
}

const roots: string[] = config.roots || ['angular', 'core', 'tests', 'agentica'];
const extensions: string[] = config.extensions || ['.ts', '.tsx'];
const skipDirs = new Set<string>(config.skipDirs || ['node_modules', 'dist', '.angular', 'out-tsc', 'build']);

function walk(dir: string, callback: (filepath: string) => void) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            if (skipDirs.has(file)) continue;
            walk(filepath, callback);
        } else if (stats.isFile() && extensions.some((ext) => file.endsWith(ext))) {
            callback(filepath);
        }
    }
}

function fixImports(filepath: string) {
    let content = fs.readFileSync(filepath, 'utf8');
    const originalContent = content;

    content = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, (match, p1) => {
        return `from '${p1}'`;
    });

    content = content.replace(/import\(['"]([^'"]+)\.ts['"]\)/g, (match, p1) => {
        return `import('${p1}')`;
    });

    content = content.replace(/import\s+['"]([^'"]+)\.ts['"]/g, (match, p1) => {
        return `import '${p1}'`;
    });

    content = content.replace(/export\s+.*?\s+from\s+['"]([^'"]+)\.ts['"]/g, (match) => {
        return match.replace('.ts', '');
    });

    if (content !== originalContent) {
        console.log(`Fixing ${filepath}`);
        fs.writeFileSync(filepath, content, 'utf8');
    }
}

for (const rootName of roots) {
    const rootDir = path.resolve(projectRoot, rootName);
    walk(rootDir, (filepath) => {
        fixImports(filepath);
    });
}
