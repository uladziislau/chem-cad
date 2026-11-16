import type { EpicStatus, TaskPriority } from './types';

/**
 * DevFeature — фича: промежуточная группировка между эпиком и задачами.
 * Опциональное расширение базовой модели
 * (synchronika/specifications/software/development/development-model.md
 * §«Дополнительные сущности»): `{ id, epicId, title, description, status, priority, progress }`.
 */
export interface DevFeature {
  id: string;
  epicId: string;
  title: string;
  description: string;
  status: EpicStatus;
  priority: TaskPriority;
  /** 0–100 */
  progress: number;
}
