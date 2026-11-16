import { Injectable, inject } from '@angular/core';
import { CatalogService, IngredientCategory } from './catalog.service';
import { isOperationType, ManufacturingProcess, ProcessStep, OperationType } from '@root-modules/engine/process-step.interface';
import { RawIngredientInput } from '@root-modules/engine/types';

const PROCESS_KEY = 'chem-cad.process.v1';

interface StoredIngredient {
  entityName: string;
  massGrams: number;
  category: IngredientCategory;
}

interface StoredStep {
  id: string;
  name: string;
  operation: OperationType;
  targetTemperature?: number;
  rpm?: number;
  durationMinutes: number;
  instructions?: string;
  ingredients?: StoredIngredient[];
}

interface StoredProcess {
  name: string;
  steps: StoredStep[];
}

/**
 * Персистентность технологического процесса в localStorage.
 * Entity не сериализуется — ингредиенты резолвятся по имени entity
 * через CatalogService.findByEntityName при загрузке.
 */
@Injectable({ providedIn: 'root' })
export class ProcessPersistenceService {
  private catalog = inject(CatalogService);

  save(process: ManufacturingProcess): void {
    try {
      const stored: StoredProcess = {
        name: process.name,
        steps: process.steps.map(s => this.serializeStep(s))
      };
      localStorage.setItem(PROCESS_KEY, JSON.stringify(stored));
    } catch { /* ignore quota errors */ }
  }

  /**
   * Загружает процесс. Битые шаги (невалидная операция, длительность, id)
   * и ингредиенты (неизвестное имя, неположительная масса) отбрасываются,
   * чтобы повреждённый localStorage не ломал весь процесс.
   */
  load(): ManufacturingProcess | null {
    try {
      const raw = localStorage.getItem(PROCESS_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as Partial<StoredProcess> | null;
      if (!stored || !Array.isArray(stored.steps)) return null;

      const steps: ProcessStep[] = [];
      for (const s of stored.steps) {
        const step = this.deserializeStep(s);
        if (step) steps.push(step);
      }
      if (steps.length === 0) return null;

      return {
        id: 'proc_restored',
        name: typeof stored.name === 'string' && stored.name.trim() ? stored.name : 'Восстановленный процесс',
        steps,
        createdAt: new Date()
      };
    } catch {
      return null;
    }
  }

  private serializeStep(step: ProcessStep): StoredStep {
    return {
      id: step.id,
      name: step.name,
      operation: step.operation,
      targetTemperature: step.targetTemperature,
      rpm: step.rpm,
      durationMinutes: step.durationMinutes,
      instructions: step.instructions,
      ingredients: step.ingredients?.map(i => ({
        entityName: i.entity.getName(),
        massGrams: i.massGrams,
        category: i.category as IngredientCategory
      }))
    };
  }

  private parseIngredients(stored: unknown): RawIngredientInput[] {
    const ingredients: RawIngredientInput[] = [];
    for (const ing of Array.isArray(stored) ? stored : []) {
      if (!ing || typeof ing.entityName !== 'string') continue;
      if (!Number.isFinite(ing.massGrams) || ing.massGrams <= 0) continue;
      const found = this.catalog.findByEntityName(ing.entityName);
      if (found) {
        ingredients.push({ entity: found.entity, massGrams: ing.massGrams, category: ing.category });
      }
    }
    return ingredients;
  }

  /** Возвращает null для шага, который нельзя безопасно восстановить. */
  private deserializeStep(stored: StoredStep | null | undefined): ProcessStep | null {
    if (!stored || typeof stored !== 'object') return null;
    if (!isOperationType(stored.operation)) return null;
    if (!Number.isFinite(stored.durationMinutes) || stored.durationMinutes <= 0) return null;

    const id = typeof stored.id === 'string' && stored.id.trim() ? stored.id : crypto.randomUUID();
    const name = typeof stored.name === 'string' && stored.name.trim()
      ? stored.name
      : 'Этап без названия';

    const ingredients = this.parseIngredients(stored.ingredients);

    return {
      id,
      name,
      operation: stored.operation,
      targetTemperature: typeof stored.targetTemperature === 'number' ? stored.targetTemperature : undefined,
      rpm: typeof stored.rpm === 'number' ? stored.rpm : undefined,
      durationMinutes: stored.durationMinutes,
      instructions: typeof stored.instructions === 'string' ? stored.instructions : undefined,
      ingredients: ingredients.length > 0 ? ingredients : undefined
    };
  }
}
