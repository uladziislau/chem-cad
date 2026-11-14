import { Injectable, signal } from '@angular/core';
import { Recipe } from '@root-modules/recipe/models/recipe.model';
import { RECIPES } from '@data/recipe/recipe.data';

const STORAGE_KEY = 'chem-cad.recipes.v1';
const VALID_CATEGORIES: Record<string, true> = { hygiene: true, perfume: true, cleaning: true };
const VALID_DIFFICULTIES: Record<string, true> = { easy: true, medium: true, hard: true };

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  const ingredients = r['ingredients'];
  const steps = r['steps'];
  const warnings = r['safetyWarnings'];
  return typeof r['id'] === 'string' && (r['id'] as string).length > 0
    && typeof r['name'] === 'string' && (r['name'] as string).length > 0
    && typeof r['category'] === 'string' && VALID_CATEGORIES[r['category'] as string] === true
    && typeof r['description'] === 'string'
    && typeof r['difficulty'] === 'string' && VALID_DIFFICULTIES[r['difficulty'] as string] === true
    && Array.isArray(ingredients) && ingredients.every(i =>
      typeof i === 'object' && i !== null
      && typeof (i as Record<string, unknown>)['ingredientId'] === 'string'
      && typeof (i as Record<string, unknown>)['percentage'] === 'number'
      && typeof (i as Record<string, unknown>)['purpose'] === 'string')
    && Array.isArray(steps) && steps.every(s => typeof s === 'string')
    && Array.isArray(warnings) && warnings.every(s => typeof s === 'string');
}

/**
 * Хранилище рецептур: встроенные RECIPES + пользовательские из localStorage.
 * Поддерживает export/import в JSON и дублирование.
 */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private recipesSignal = signal<Recipe[]>(this.load());

  getRecipes() {
    return this.recipesSignal.asReadonly();
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.recipesSignal().find(r => r.id === id);
  }

  isCustom(recipe: Recipe): boolean {
    return recipe.isCustom === true;
  }

  addRecipe(recipe: Omit<Recipe, 'id' | 'isCustom'>): Recipe {
    const created: Recipe = { ...recipe, id: this.nextId(), isCustom: true };
    this.persist([...this.recipesSignal(), created]);
    return created;
  }

  duplicateRecipe(id: string): Recipe | undefined {
    const source = this.getRecipeById(id);
    if (!source) return undefined;
    const { id: _id, isCustom: _c, ...rest } = source;
    return this.addRecipe({ ...rest, name: `${source.name} (копия)` });
  }

  removeRecipe(id: string): boolean {
    const target = this.getRecipeById(id);
    if (!target || !target.isCustom) return false;
    this.persist(this.recipesSignal().filter(r => r.id !== id));
    return true;
  }

  exportRecipes(ids?: string[]): string {
    const selected = ids?.length
      ? this.recipesSignal().filter(r => ids.includes(r.id))
      : this.recipesSignal();
    return JSON.stringify(selected, null, 2);
  }

  exportRecipe(id: string): string | undefined {
    const recipe = this.getRecipeById(id);
    return recipe ? JSON.stringify(recipe, null, 2) : undefined;
  }

  /**
   * Импорт JSON-массива рецептов. Возвращает количество добавленных.
   * id коллизии и невалидные записи пропускаются/переназначаются.
   */
  importRecipes(json: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return 0;
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    const valid = list.filter(isRecipe);
    if (valid.length === 0) return 0;

    const existing = new Set(this.recipesSignal().map(r => r.id));
    const imported: Recipe[] = valid.map(r => ({
      ...r,
      id: existing.has(r.id) ? this.nextId() : r.id,
      isCustom: true,
    }));
    for (const r of imported) existing.add(r.id);
    this.persist([...this.recipesSignal(), ...imported]);
    return imported.length;
  }

  private load(): Recipe[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const stored = parsed.filter(isRecipe);
          if (stored.length > 0) return stored;
        }
      }
    } catch { /* повреждённый JSON — откатываемся на встроенные */ }
    return RECIPES.map(r => ({ ...r, isCustom: false }));
  }

  private persist(recipes: Recipe[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    } catch { /* quota/private mode — молча пропускаем */ }
    this.recipesSignal.set(recipes);
  }

  private nextId(): string {
    return `r_custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }
}
