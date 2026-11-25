/**
 * Проверка окружения до загрузки остальных модулей.
 * Импортируется первым: если typescript недоступен, остальные импорты не выполняются.
 */
export {};

try {
  await import('typescript');
} catch {
  console.error('❌ В проекте не установлен typescript. Выполни bun install (или npm ci) и повтори.');
  process.exit(1);
}
