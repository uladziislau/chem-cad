import type { Weakness } from '../domain';

/**
 * Слабые места medicina — реестр того, что тянет проект вниз.
 * detectionSource: manual — найдено при аудите/работе над модулем разработки.
 */
export const WEAKNESSES: Weakness[] = [
  {
    id: 'wk-inline-templates',
    code: 'WK-001',
    title: 'Монолитные UI-компоненты с inline-шаблонами',
    description:
      'Страницы angular/modules/development содержат шаблоны на 100–200 строк ' +
      'внутри .ts-файлов: логика, разметка и стили в одном файле. ' +
      'Сложно ревьюить и тестировать раздельно.',
    severity: 'medium',
    status: 'open',
    category: 'architecture',
    targetPath: 'angular/modules/development/ui/pages',
    impactScore: 55,
    detectionSource: 'manual',
    suggestedRemediation:
      'Выносить шаблоны в отдельные .html и стили в .css по мере касания страниц; ' +
      'критерий — файл не более ~300 строк.',
    identifiedAt: '2026-11-16',
    tags: ['ui', 'tech-debt'],
  },
  {
    id: 'wk-dev-data-json',
    code: 'WK-002',
    title: 'Данные разработки дублировались в JSON и TS-обёртках',
    description:
      'Сущности модуля разработки жили в data/development/*.json с ' +
      'нетипизированными обёртками `as Epic[]` — контракт держался на ' +
      'JSON-схемах в tests/schemas, а не на доменной модели.',
    severity: 'low',
    status: 'resolved',
    category: 'data',
    targetPath: 'modules/development/data',
    impactScore: 40,
    detectionSource: 'manual',
    suggestedRemediation:
      'Каноническая доменная модель в modules/development/domain + данные ' +
      'как типизированный TS — контракт проверяет tsc.',
    appliedFix:
      'Миграция 2026-11-16: development.types.ts заменён каноническими ' +
      'моделями, JSON конвертированы в типизированные .data.ts/.json с ' +
      'доменными типами.',
    identifiedAt: '2026-11-16',
    resolvedAt: '2026-11-16',
    tags: ['development-module', 'types'],
  },
  {
    id: 'wk-old-statuses',
    code: 'WK-003',
    title: 'Две статусные модели задач в проекте',
    description:
      'Модуль разработки использовал DevelopmentStatus ' +
      '(planned/in-progress/completed/blocked/archive) вместо ' +
      'канонического конвейера DevTask (backlog→design→implementation→' +
      'testing→review→done). UI и схемы были привязаны к старой оси.',
    severity: 'medium',
    status: 'resolved',
    category: 'architecture',
    targetPath: 'modules/development/domain',
    impactScore: 60,
    detectionSource: 'manual',
    suggestedRemediation:
      'Привести DevTask к канону development-domain-model.md §3, ' +
      'статусы маппить при миграции данных.',
    appliedFix:
      'Миграция 2026-11-16: DevTask на 6-стадийном конвейере, ' +
      'planned→backlog, completed→done, архив упразднён.',
    identifiedAt: '2026-11-16',
    resolvedAt: '2026-11-16',
    tags: ['development-module', 'canon'],
  },
  {
    id: 'wk-no-direction-link',
    code: 'WK-004',
    title: 'Эпики не были привязаны к направлениям',
    description:
      'Epic не имел directionId — невозможно ответить «какой вектор ' +
      'обслуживает эпик» и построить roadmap по направлениям.',
    severity: 'medium',
    status: 'resolved',
    category: 'architecture',
    targetPath: 'modules/development/data/epics.data.ts',
    impactScore: 50,
    detectionSource: 'manual',
    suggestedRemediation:
      'Ввести StrategicDirection и обязательный directionId у Epic.',
    appliedFix:
      'Миграция 2026-11-16: добавлены 6 StrategicDirection, ' +
      'все 12 эпиков привязаны к векторам.',
    identifiedAt: '2026-11-16',
    resolvedAt: '2026-11-16',
    tags: ['development-module', 'canon'],
  },
];
