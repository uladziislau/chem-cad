import type {
  AuditCheckItem,
  AuditCheckpointRecord,
  ProjectHealthSummary,
} from '../domain';

/**
 * Аудит medicina — проверки здоровья проекта.
 * Чек-лист отражает ручной аудит 2026-11-16 (модуль разработки + слои).
 */
export const AUDIT_CHECKS: AuditCheckItem[] = [
  {
    id: 'chk-domain-canon',
    name: 'Каноническая доменная модель',
    category: 'architecture',
    description:
      'modules/development/domain содержит все сущности канона: ' +
      'StrategicDirection, Epic, DevTask, DevFeature, DevSpecification, ' +
      'CompositionEntry, ArchitectureModule, Weakness, Audit.',
    status: 'pass',
    issuesCount: 0,
    details: ['9 файлов моделей + types + presentation types'],
  },
  {
    id: 'chk-task-pipeline',
    name: 'Конвейер задач 6 стадий',
    category: 'architecture',
    description:
      'DevTask.status использует канонический конвейер ' +
      'backlog→design→implementation→testing→review→done.',
    status: 'pass',
    issuesCount: 0,
  },
  {
    id: 'chk-composition-coverage',
    name: 'Покрытие CompositionEntry',
    category: 'layers',
    description:
      'Реестр состава покрывает все modules/* и angular/modules/* ' +
      'плюс слой данных angular/data.',
    status: 'pass',
    issuesCount: 0,
    details: ['53 записи: 18 module + 34 angular-module + 1 data'],
  },
  {
    id: 'chk-epic-directions',
    name: 'Привязка эпиков к направлениям',
    category: 'data',
    description: 'Каждый Epic имеет directionId → StrategicDirection.',
    status: 'pass',
    issuesCount: 0,
    details: ['12/12 эпиков привязаны к 6 направлениям'],
  },
  {
    id: 'chk-task-module-links',
    name: 'Связь задач с составом',
    category: 'data',
    description:
      'DevTask.module ссылается на существующие CompositionEntry.',
    status: 'warning',
    issuesCount: 0,
    details: ['Все 9 задач имеют module → валидные id'],
  },
  {
    id: 'chk-inline-templates',
    name: 'Размер UI-компонентов',
    category: 'architecture',
    description:
      'Страницы development-модуля содержат inline-шаблоны 100–200 строк.',
    status: 'warning',
    issuesCount: 4,
    details: ['tasks, epics, features, specifications pages'],
  },
  {
    id: 'chk-spec-content',
    name: 'Спецификации с содержимым',
    category: 'data',
    description:
      'DevSpecification.contentMarkdown заполнен, keyRequirements заданы.',
    status: 'pass',
    issuesCount: 0,
  },
];

export const PROJECT_HEALTH: ProjectHealthSummary = {
  phiScore: 86,
  statusText: 'Хорошее здоровье: каноническая модель внедрена, остались UI-долги',
  totalChecks: AUDIT_CHECKS.length,
  passedChecks: AUDIT_CHECKS.filter((c) => c.status === 'pass').length,
  warningChecks: AUDIT_CHECKS.filter((c) => c.status === 'warning').length,
  errorChecks: AUDIT_CHECKS.filter((c) => c.status === 'error').length,
  lastRunAt: '2026-11-16',
  checks: AUDIT_CHECKS,
};

export const AUDIT_CHECKPOINTS: AuditCheckpointRecord[] = [
  {
    toolId: 'manual-audit',
    toolName: 'Ручной аудит модуля разработки',
    durationMs: 0,
    scopeFingerprint: 'modules/development+angular/modules/development',
    filesScannedCount: 25,
    defectsCount: 4,
    summary:
      'Миграция на каноническую модель: домен, данные, 6 направлений, ' +
      '53 записи состава. Открыто: inline-шаблоны страниц.',
    status: 'warning',
    recordedAt: '2026-11-16',
  },
];
