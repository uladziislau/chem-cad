// @ts-check
// ESLint остался ТОЛЬКО на шаблонах: oxlint HTML не парсит.
// TypeScript/JavaScript линтует oxlint (см. .oxlintrc.json).
//
// Блок для **/*.ts нужен ради processInlineTemplates: он вытаскивает
// инлайн-шаблон `template: \`...\`` из .ts и линтует его как HTML.
// Без него a11y инлайнов не проверяется (в этом проекте их 30).
const {defineConfig} = require('eslint/config');
const angular = require('angular-eslint');

const templateRules = [
  angular.configs.templateRecommended,
  angular.configs.templateAccessibility,
];

module.exports = defineConfig([
  {
    files: ['**/*.html'],
    extends: templateRules,
    rules: {},
  },
  {
    files: ['**/*.ts'],
    processor: angular.processInlineTemplates,
    extends: templateRules,
    rules: {},
  }
]);