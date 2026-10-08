// @ts-check
// ESLint остался ТОЛЬКО на шаблонах: oxlint HTML не парсит, а
// TypeScript/JavaScript линтует oxlint (см. .oxlintrc.json).
//
// Блок **/*.ts существует только ради инлайн-шаблонов `template: \`...\``:
// processor вытаскивает их в виртуальный файл с расширением .html,
// который подхватывает следующий блок с правилами шаблонов. Самих
// правил для TypeScript здесь нет - это работа oxlint.
//
// Парсер обязателен: без него .ts читается дефолтным JS-парсером и
// падает на синтаксисе TypeScript.
const {defineConfig} = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    languageOptions: {parser: tseslint.parser},
    plugins: {'@typescript-eslint': tseslint.plugin},
    // Правило объявлено выключенным, а не удалено: в коде есть
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, и без
    // определения ESLint падает с «rule was not found». Само правило
    // работает в oxlint, поэтому комментарий подавления нужен.
    // Комментарии eslint-disable в TypeScript обслуживает oxlint, поэтому
    // ESLint не должен считать их неиспользованными.
    linterOptions: {reportUnusedDisableDirectives: 'off'},
    rules: {'@typescript-eslint/no-explicit-any': 'off'},
    processor: angular.processInlineTemplates,
  },
  {
    files: ['**/*.html'],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  }
]);