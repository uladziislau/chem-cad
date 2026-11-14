import { Injectable, inject, signal } from '@angular/core';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { FormulationItem } from '@root-modules/formulation/models/ingredient.model';

const STORAGE_KEY = 'chem-cad.formulator.draft.v1';

interface StoredItem {
  ingredientId: string;
  percentage: number;
}

function isStoredItem(value: unknown): value is StoredItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['ingredientId'] === 'string' && (v['ingredientId'] as string).length > 0
    && typeof v['percentage'] === 'number' && Number.isFinite(v['percentage'])
    && (v['percentage'] as number) >= 0 && (v['percentage'] as number) <= 100;
}

/**
 * Черновик рецептуры формулятора (страница /formulator).
 * Хранит только {ingredientId, percentage} — ингредиент резолвится
 * через IngredientService при загрузке; записи с неизвестным id
 * (удалённые кастомные ингредиенты) отбрасываются.
 *
 * Lab-сторона (FormulationStateService, модули masses) — отдельный
 * контур с собственным ключом chem-cad.formulation.items.v1.
 */
@Injectable({ providedIn: 'root' })
export class FormulationDraftService {
  private ingredientService = inject(IngredientService);
  private itemsSignal = signal<FormulationItem[]>(this.load());

  getItems() {
    return this.itemsSignal.asReadonly();
  }

  setItems(items: FormulationItem[]): void {
    this.persist(items);
    this.itemsSignal.set(items);
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* private mode */ }
    this.itemsSignal.set([]);
  }

  private load(): FormulationItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const items: FormulationItem[] = [];
      const seen = new Set<string>();
      for (const entry of parsed) {
        if (!isStoredItem(entry) || seen.has(entry.ingredientId)) continue;
        const ingredient = this.ingredientService.getIngredientById(entry.ingredientId);
        if (!ingredient) continue;
        seen.add(entry.ingredientId);
        items.push({ ingredient, percentage: entry.percentage });
      }
      return items;
    } catch {
      return [];
    }
  }

  private persist(items: FormulationItem[]): void {
    try {
      const stored: StoredItem[] = items.map(i => ({
        ingredientId: i.ingredient.id,
        percentage: i.percentage,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch { /* quota/private mode — молча пропускаем */ }
  }
}
