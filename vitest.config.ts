import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Алиасы зеркалят tsconfig.json → compilerOptions.paths.
 * Важно: порядок специфичных путей перед общими (@modules/development/*
 * указывает на чистый TS modules/, @modules/* — на angular/modules/).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: [
      { find: '@root-modules', replacement: path.resolve(__dirname, 'modules') },
      { find: '@domain', replacement: path.resolve(__dirname, 'domain') },
      { find: '@data', replacement: path.resolve(__dirname, 'data') },
      { find: '@adapters', replacement: path.resolve(__dirname, 'angular/adapters') },
      { find: '@ui', replacement: path.resolve(__dirname, 'angular/ui') },
      { find: '@modules', replacement: path.resolve(__dirname, 'angular/modules') },
    ],
  },
});
