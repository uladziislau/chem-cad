import type {
  ArchitectureModule,
  AuditCheckItem,
  AuditCheckpointRecord,
  CompositionEntry,
  DevFeature,
  DevSpecification,
  DevTask,
  Epic,
  ProjectHealthSummary,
  StrategicDirection,
  Weakness,
} from '../domain';
import { ARCHITECTURE_MODULES } from '../data/architecture-modules.data';
import { AUDIT_CHECKPOINTS, AUDIT_CHECKS, PROJECT_HEALTH } from '../data/audit.data';
import { COMPOSITION_BY_ID, COMPOSITION_ENTRIES } from '../data/composition.data';
import { FEATURES } from '../data/dev-features.data';
import { TASKS } from '../data/dev-tasks.data';
import { EPICS } from '../data/epics.data';
import { SPECIFICATIONS } from '../data/specifications.data';
import { STRATEGIC_DIRECTIONS } from '../data/directions.data';
import { WEAKNESSES } from '../data/weaknesses.data';

/**
 * DevelopmentCoreService — чистый TS-сервис модуля «Разработка» (без DI).
 * Читает канонические данные и предоставляет вычисляемые проекции:
 * статистику, прогресс направлений и эпиков, связи задача↔состав.
 */
export class DevelopmentCoreService {
  readonly directions: StrategicDirection[] = STRATEGIC_DIRECTIONS;
  readonly epics: Epic[] = EPICS;
  readonly features: DevFeature[] = FEATURES;
  readonly tasks: DevTask[] = TASKS;
  readonly specifications: DevSpecification[] = SPECIFICATIONS;
  readonly composition: CompositionEntry[] = COMPOSITION_ENTRIES;
  readonly architectureModules: ArchitectureModule[] = ARCHITECTURE_MODULES;
  readonly weaknesses: Weakness[] = WEAKNESSES;
  readonly auditChecks: AuditCheckItem[] = AUDIT_CHECKS;
  readonly projectHealth: ProjectHealthSummary = PROJECT_HEALTH;
  readonly auditCheckpoints: AuditCheckpointRecord[] = AUDIT_CHECKPOINTS;

  getDirection(id: string): StrategicDirection | undefined {
    return this.directions.find((d) => d.id === id);
  }

  getEpic(id: string): Epic | undefined {
    return this.epics.find((e) => e.id === id);
  }

  getTasksByEpic(epicId: string): DevTask[] {
    return this.tasks.filter((t) => t.epicId === epicId || t.featureId && this.featureEpic(t.featureId) === epicId);
  }

  getTasksByDirection(directionId: string): DevTask[] {
    const epicIds = new Set(
      this.epics.filter((e) => e.directionId === directionId).map((e) => e.id),
    );
    return this.tasks.filter(
      (t) => t.directionId === directionId || (t.epicId && epicIds.has(t.epicId)),
    );
  }

  getFeaturesByEpic(epicId: string): DevFeature[] {
    return this.features.filter((f) => f.epicId === epicId);
  }

  getCompositionEntry(id: string): CompositionEntry | undefined {
    return COMPOSITION_BY_ID[id];
  }

  /** Прогресс эпика: доля done-задач (0–100). */
  epicProgress(epicId: string): number {
    const tasks = this.getTasksByEpic(epicId);
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }

  /** Прогресс направления: среднее по эпикам + milestones. */
  directionProgress(directionId: string): number {
    const dir = this.getDirection(directionId);
    if (!dir) return 0;
    const milestoneDone =
      dir.milestones.length === 0
        ? 0
        : dir.milestones.filter((m) => m.isCompleted).length / dir.milestones.length;
    const epics = this.epics.filter((e) => e.directionId === directionId);
    const epicAvg =
      epics.length === 0
        ? 0
        : epics.reduce((a, e) => a + this.epicProgress(e.id), 0) / epics.length / 100;
    return Math.round(((milestoneDone + epicAvg) / 2) * 100);
  }

  /** Задачи, трогающие конкретный элемент состава. */
  tasksTouchingModule(moduleId: string): DevTask[] {
    return this.tasks.filter((t) => t.module === moduleId);
  }

  private featureEpic(featureId: string): string | undefined {
    return this.features.find((f) => f.id === featureId)?.epicId;
  }
}

export const developmentCore = new DevelopmentCoreService();
