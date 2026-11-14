import { Injectable, inject } from '@angular/core';
import { CatalogService, IngredientCategory } from './catalog.service';
import { ManufacturingProcess, ProcessStep, OperationType } from '@root-modules/engine/process-step.interface';
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

  load(): ManufacturingProcess | null {
    try {
      const raw = localStorage.getItem(PROCESS_KEY);
      if (!raw) return null;
      const stored: StoredProcess = JSON.parse(raw);
      if (!stored.steps?.length) return null;

      const steps: ProcessStep[] = stored.steps.map(s => this.deserializeStep(s));
      return {
        id: 'proc_restored',
        name: stored.name || 'Восстановленный процесс',
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

  private deserializeStep(stored: StoredStep): ProcessStep {
    const ingredients: RawIngredientInput[] = [];
    for (const ing of stored.ingredients || []) {
      const found = this.catalog.findByEntityName(ing.entityName);
      if (found) {
        ingredients.push({ entity: found.entity, massGrams: ing.massGrams, category: ing.category });
      }
    }
    return {
      id: stored.id,
      name: stored.name,
      operation: stored.operation,
      targetTemperature: stored.targetTemperature,
      rpm: stored.rpm,
      durationMinutes: stored.durationMinutes,
      instructions: stored.instructions,
      ingredients: ingredients.length > 0 ? ingredients : undefined
    };
  }
}
