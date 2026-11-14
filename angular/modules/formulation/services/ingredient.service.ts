import { Injectable, signal } from '@angular/core';
import { Ingredient } from '@root-modules/formulation/models/ingredient.model';
import { INGREDIENTS } from '@data/formulation/ingredient.data';

const STORAGE_KEY = 'chem-cad.ingredients.v1';
const VALID_TYPES: Record<string, true> = {
  surfactant: true, solvent: true, fragrance: true,
  preservative: true, active: true, base: true, additive: true,
};

function isIngredient(value: unknown): value is Ingredient {
  if (typeof value !== 'object' || value === null) return false;
  const i = value as Record<string, unknown>;
  return typeof i['id'] === 'string' && (i['id'] as string).length > 0
    && typeof i['name'] === 'string' && (i['name'] as string).length > 0
    && typeof i['type'] === 'string' && VALID_TYPES[i['type'] as string] === true
    && typeof i['description'] === 'string'
    && typeof i['safety'] === 'string';
}

/**
 * Каталог ингредиентов: встроенные INGREDIENTS + пользовательские из localStorage.
 * Поддерживает создание/редактирование/удаление своих ингредиентов,
 * export/import в JSON.
 */
@Injectable({ providedIn: 'root' })
export class IngredientService {
  private ingredientsSignal = signal<Ingredient[]>(this.load());

  getIngredients() {
    return this.ingredientsSignal.asReadonly();
  }

  getIngredientById(id: string): Ingredient | undefined {
    return this.ingredientsSignal().find(i => i.id === id);
  }

  isCustom(ingredient: Ingredient): boolean {
    return ingredient.isCustom === true;
  }

  addIngredient(ingredient: Omit<Ingredient, 'id' | 'isCustom'>): Ingredient {
    const created: Ingredient = { ...ingredient, id: this.nextId(), isCustom: true };
    this.persist([...this.ingredientsSignal(), created]);
    return created;
  }

  updateIngredient(id: string, patch: Partial<Omit<Ingredient, 'id' | 'isCustom'>>): Ingredient | undefined {
    const current = this.ingredientsSignal();
    const index = current.findIndex(i => i.id === id);
    if (index === -1 || !current[index].isCustom) return undefined;
    const updated = { ...current[index], ...patch };
    const next = [...current];
    next[index] = updated;
    this.persist(next);
    return updated;
  }

  removeIngredient(id: string): boolean {
    const current = this.ingredientsSignal();
    const target = current.find(i => i.id === id);
    if (!target || !target.isCustom) return false;
    this.persist(current.filter(i => i.id !== id));
    return true;
  }

  exportIngredients(ids?: string[]): string {
    const all = this.ingredientsSignal();
    const subset = ids ? all.filter(i => ids.includes(i.id)) : all;
    return JSON.stringify(subset, null, 2);
  }

  exportIngredient(id: string): string | undefined {
    const ingredient = this.getIngredientById(id);
    return ingredient ? JSON.stringify(ingredient, null, 2) : undefined;
  }

  /**
   * Импорт JSON-массива ингредиентов. Возвращает количество добавленных.
   * Невалидные записи и коллизии id пропускаются/переназначаются.
   */
  importIngredients(json: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;
    const existingIds = new Set(this.ingredientsSignal().map(i => i.id));
    const additions: Ingredient[] = [];
    for (const item of parsed) {
      if (!isIngredient(item)) continue;
      let id = item.id;
      if (existingIds.has(id)) {
        id = this.nextId();
      }
      existingIds.add(id);
      additions.push({ ...item, id, isCustom: true });
    }
    if (additions.length === 0) return 0;
    this.persist([...this.ingredientsSignal(), ...additions]);
    return additions.length;
  }

  private load(): Ingredient[] {
    const base = INGREDIENTS.map(i => ({ ...i, isCustom: false }));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const stored = parsed.filter(isIngredient);
          const knownIds = new Set(base.map(i => i.id));
          const customs = stored.filter(i => !knownIds.has(i.id)).map(i => ({ ...i, isCustom: true }));
          return [...base, ...customs];
        }
      }
    } catch { /* повреждённый JSON — только встроенные */ }
    return base;
  }

  private persist(ingredients: Ingredient[]): void {
    try {
      const customs = ingredients.filter(i => i.isCustom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
    } catch { /* quota/private mode — молча пропускаем */ }
    this.ingredientsSignal.set(ingredients);
  }

  private nextId(): string {
    return `ing_custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }
}
