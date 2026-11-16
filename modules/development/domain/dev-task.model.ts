import type {
  DevTaskStatus,
  TaskAssignee,
  TaskPriority,
} from './types';

export interface TestRequirement {
  path: string;
  description: string;
}

/**
 * Задача разработки — каноническая модель
 * (synchronika/specifications/software/development/development-domain-model.md §3,
 * утверждена владельцем 2026-11-16).
 * Конвейер: backlog → design → implementation → testing → review → done.
 * Обязательный принцип: задача доказывается тестами (testRequirements) —
 * при переходе в done зелёные должны быть тесты, относящиеся к задаче.
 */
export interface DevTask {
  id: string;
  title: string;
  description: string;
  status: DevTaskStatus;
  priority: TaskPriority;
  epicId?: string;
  /** id DevFeature — задача внутри фичи (расширение medicina, development-model.md §Дополнительные сущности) */
  featureId?: string;
  /** id StrategicDirection — задача может принадлежать вектору без эпика */
  directionId?: string;
  /** id записи CompositionEntry, которой касается задача */
  module?: string;
  assignee?: TaskAssignee;
  implementationPlan?: string;
  testRequirements?: TestRequirement[];
  /** сколько раз задачу переделывали */
  reworkCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
