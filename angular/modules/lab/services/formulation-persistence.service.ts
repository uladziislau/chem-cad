import { Injectable, inject } from '@angular/core';
import { CatalogService, ICatalogIngredient, IngredientCategory, ProductSegment } from './catalog.service';
import { FormulationItem } from './formulation-state.service';
import { FormulationEntity } from '@domain/entities/formulation-entity';
import { ChemicalEngine } from '@root-modules/engine/chemical-engine';
import { RawIngredientInput } from '@root-modules/engine/types';
import { SimulationContext } from '@root-modules/engine/simulation-context';

const ITEMS_KEY = 'chem-cad.formulation.items.v1';
const PREMIXES_KEY = 'chem-cad.catalog.premixes.v1';

interface StoredItem {
  ingredientId: string;
  massGrams: number;
}

interface StoredPremix {
  id: string;
  name: string;
  inci: string;
  category: IngredientCategory;
  segments: ProductSegment[];
  pricePerKg: number;
  description: string;
  ghsCodes?: string[];
  safetyLevel?: 'safe' | 'caution' | 'hazardous' | 'danger';
  ppe?: string[];
  recipe: { ingredientId: string; massGrams: number; category: IngredientCategory }[];
}

/**
 * Персистентность рецептуры и пользовательских премиксов в localStorage.
 * Entity не сериализуется — premix пересобирается через ChemicalEngine
 * при загрузке, остальные ингредиенты резолвятся по id из CatalogService.
 */
@Injectable({ providedIn: 'root' })
export class FormulationPersistenceService {
  private catalog = inject(CatalogService);

  saveItems(items: FormulationItem[]): void {
    try {
      const stored: StoredItem[] = items.map(i => ({
        ingredientId: i.ingredient.id,
        massGrams: i.massGrams
      }));
      localStorage.setItem(ITEMS_KEY, JSON.stringify(stored));
    } catch { /* quota/private mode — молча пропускаем */ }
  }

  loadItems(): { ingredientId: string; massGrams: number }[] {
    try {
      const raw = localStorage.getItem(ITEMS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredItem[];
      return parsed.filter(i => typeof i.ingredientId === 'string' && typeof i.massGrams === 'number');
    } catch {
      return [];
    }
  }

  savePremixes(): void {
    try {
      // Сохраняем только premix_* — статический каталог не трогаем
      const all = this.catalog.getAllIngredients();
      const premixes = all.filter(i => i.id.startsWith('premix_'));
      const stored: StoredPremix[] = premixes.map(p => this.serializePremix(p));
      localStorage.setItem(PREMIXES_KEY, JSON.stringify(stored));
    } catch { /* ignore */ }
  }

  loadPremixes(): void {
    try {
      const raw = localStorage.getItem(PREMIXES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredPremix[];
      // Сначала добавляем все карточки, потом восстанавливаем entity
      // (рецептура premix может ссылаться на другой premix).
      const restored = new Map<string, ICatalogIngredient>();
      for (const p of parsed) {
        const ingredient = this.deserializePremix(p, restored);
        if (ingredient) {
          this.catalog.addIngredient(ingredient);
          restored.set(p.id, ingredient);
        }
      }
    } catch { /* ignore */ }
  }

  private serializePremix(ing: ICatalogIngredient): StoredPremix {
    const entity = ing.entity;
    const recipe = entity instanceof FormulationEntity
      ? entity.getRecipe().map(r => this.serializeRecipeEntry(r))
      : [];
    return {
      id: ing.id,
      name: ing.name,
      inci: ing.inci,
      category: ing.category,
      segments: ing.segments,
      pricePerKg: ing.pricePerKg,
      description: ing.description,
      ghsCodes: ing.ghsCodes,
      safetyLevel: ing.safetyLevel,
      ppe: ing.ppe,
      recipe
    };
  }

  private serializeRecipeEntry(r: RawIngredientInput): { ingredientId: string; massGrams: number; category: IngredientCategory } {
    // Ищем ингредиент по entity в каталоге
    const found = this.catalog.getAllIngredients().find(i => i.entity === r.entity);
    return {
      ingredientId: found?.id ?? '',
      massGrams: r.massGrams,
      category: r.category as IngredientCategory
    };
  }

  private deserializePremix(p: StoredPremix, restored: Map<string, ICatalogIngredient>): ICatalogIngredient | null {
    if (!p.id || !p.name) return null;

    // Резолвим рецепт: id → ингредиент из каталога (включая уже восстановленные premix)
    const recipe: RawIngredientInput[] = [];
    for (const r of p.recipe) {
      const ing = r.ingredientId ? this.findIngredient(r.ingredientId, restored) : undefined;
      if (ing) {
        recipe.push({ entity: ing.entity, massGrams: r.massGrams, category: r.category });
      }
    }
    if (recipe.length === 0) return null;

    // Пересобираем MultiphaseSystem через движок
    const ctx = new SimulationContext(25, 1, 0, 0);
    const result = ChemicalEngine.runSimulation(recipe, ctx);
    const entity = new FormulationEntity(p.name, recipe, result.system);

    return {
      id: p.id,
      name: p.name,
      inci: p.inci,
      category: p.category,
      segments: p.segments,
      pricePerKg: p.pricePerKg,
      description: p.description,
      ghsCodes: p.ghsCodes,
      safetyLevel: p.safetyLevel,
      ppe: p.ppe,
      entity
    };
  }

  private findIngredient(id: string, restored: Map<string, ICatalogIngredient>): ICatalogIngredient | undefined {
    return restored.get(id) ?? this.catalog.getIngredientById(id);
  }
}
