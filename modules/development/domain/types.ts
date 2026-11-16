/**
 * Доменные типы модуля «Разработка» — объединённые перечисления.
 * Источник норм: synchronika/specifications/software/development/development-domain-model.md
 */

// --- Вектор (направление) ---
export type DirectionStatus = 'active' | 'paused' | 'completed';
export type DirectionPriority = 'critical' | 'high' | 'medium' | 'low';
export type DirectionCategory =
  | 'core_product'
  | 'community'
  | 'infrastructure'
  | 'ai_agentica'
  | (string & {});
export type ComplexityEstimate = 'S' | 'M' | 'L' | 'XL';

// --- Эпик / задача ---
export type EpicStatus = 'backlog' | 'in_progress' | 'done';
/**
 * Конвейер задачи (канон development-domain-model.md §3):
 * backlog → design → implementation → testing → review → done.
 * review = код-ревью + рефакторинг, после — повторный прогон тестов задачи.
 */
export type DevTaskStatus =
  | 'backlog'
  | 'design'
  | 'implementation'
  | 'testing'
  | 'review'
  | 'done';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskAssignee = 'architect' | 'agent' | 'team';

// --- Спецификация ---
export type DevSpecStatus = 'draft' | 'approved' | 'in_progress' | 'completed';

// --- Состав проекта ---
export type CompositionKind =
  | 'module'
  | 'angular-module'
  | 'page'
  | 'component'
  | 'service'
  | 'data'
  | 'route';

// --- Архитектурный модуль ---
export type ModuleStatus = 'planned' | 'in_progress' | 'completed';

// --- Слабые места ---
export type WeaknessSeverity = 'critical' | 'high' | 'medium' | 'low';
export type WeaknessStatus = 'open' | 'in_progress' | 'resolved';

// --- Аудит ---
export type AuditSeverity = 'pass' | 'warning' | 'error';
export type AuditCategory =
  | 'architecture'
  | 'performance'
  | 'naming'
  | 'signals'
  | 'layers'
  | 'data'
  | 'accessibility';
export type AuditToolStatus = 'pass' | 'warning' | 'error';
