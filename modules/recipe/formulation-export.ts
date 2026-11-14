import { Recipe, RecipeStep } from './models/recipe.model';

/** Минимальная форма строки рецептуры формулятора (без привязки к Angular). */
export interface FormulationExportItem {
  /** id ингредиента (совпадает с RecipeIngredient.ingredientId) */
  ingredientId: string;
  name: string;
  /** тип ингредиента: surfactant | solvent | fragrance | ... */
  type: string;
  /** назначение/описание → RecipeIngredient.purpose */
  description: string;
  /** предупреждение безопасности → safetyWarnings */
  safety: string;
  percentage: number;
}

export interface FormulationRecipeDraft {
  name: string;
  category: Recipe['category'];
  description?: string;
}

const FRAGRANCE_TYPES = new Set(['fragrance']);

function isTrivialSafety(safety: string): boolean {
  const s = safety.trim().toLowerCase();
  return s.length < 10 || s.includes('безопасн');
}

/**
 * Конвертирует текущую рецептуру формулятора (проценты) в черновик Recipe
 * для RecipeService.addRecipe. Шаги генерируются шаблонно: смешивание +
 * добавление каждого компонента.
 */
export function formulationToRecipe(
  items: FormulationExportItem[],
  draft: FormulationRecipeDraft,
): Omit<Recipe, 'id' | 'isCustom'> {
  const ingredients = items
    .filter(i => i.percentage > 0)
    .map(i => ({
      ingredientId: i.ingredientId,
      percentage: i.percentage,
      purpose: i.description || i.type,
    }));

  const safetyWarnings = items
    .map(i => i.safety.trim())
    .filter(s => s.length > 0 && !isTrivialSafety(s));
  if (items.some(i => FRAGRANCE_TYPES.has(i.type))) {
    safetyWarnings.push('Продукт содержит ароматические компоненты — проверьте на индивидуальную переносимость.');
  }

  const steps: RecipeStep[] = [
    { text: 'Подготовьте чистую сухую ёмкость и отмерьте компоненты по списку.' },
    ...ingredients.map(ing => {
      const item = items.find(i => i.ingredientId === ing.ingredientId)!;
      return {
        text: `Добавьте ${item.name} (${ing.percentage}%) и перемешайте до однородного состояния.`,
        ingredientIds: [ing.ingredientId],
      };
    }),
    { text: 'Проверьте итоговый объём и перелейте продукт в тару для хранения.' },
  ];

  return {
    name: draft.name.trim() || 'Моя рецептура',
    category: draft.category,
    description: draft.description?.trim()
      || `Автоматически создано из формулятора. Компонентов: ${ingredients.length}.`,
    difficulty: 'easy',
    ingredients,
    steps,
    safetyWarnings,
  };
}

/** Минимум полей каталога ингредиентов формулятора для резолва ссылок. */
export interface CatalogIngredientRef {
  id: string;
  name: string;
}

/**
 * Резолвит id ингредиента lab-контура (ing_*) в id каталога формулятора.
 * Порядок: точный id → совпадение имени → strip префикса ing_.
 */
export function resolveCatalogIngredientId(
  labIngredient: { id: string; name: string },
  catalog: CatalogIngredientRef[],
): string | null {
  const exact = catalog.find(c => c.id === labIngredient.id);
  if (exact) return exact.id;
  const byName = catalog.find(c => c.name.toLowerCase() === labIngredient.name.toLowerCase());
  if (byName) return byName.id;
  const stripped = labIngredient.id.replace(/^ing_/, '');
  const byStripped = catalog.find(c => c.id === stripped);
  return byStripped ? byStripped.id : null;
}

/** Строка lab-рецептуры (масса в граммах) для экспорта. */
export interface LabFormulationItem {
  ingredient: { id: string; name: string; description: string; category?: string; safetyLevel?: string; ppe?: string[] };
  massGrams: number;
}

/**
 * Конвертирует lab-рецептуру (массы) в FormulationExportItem[] с процентами.
 * Ингредиенты без соответствия в каталоге формулятора пропускаются;
 * проценты пересчитываются от суммы замапленных масс.
 * Возвращает items и список пропущенных имён.
 */
export function labItemsToFormulationExport(
  items: LabFormulationItem[],
  catalog: CatalogIngredientRef[],
): { items: FormulationExportItem[]; skipped: string[] } {
  const resolved: { item: LabFormulationItem; catalogId: string }[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    if (item.massGrams <= 0) continue;
    const catalogId = resolveCatalogIngredientId(item.ingredient, catalog);
    if (catalogId) resolved.push({ item, catalogId });
    else skipped.push(item.ingredient.name);
  }
  const total = resolved.reduce((s, r) => s + r.item.massGrams, 0);
  if (total <= 0) return { items: [], skipped };
  const exportItems = resolved.map(({ item, catalogId }) => ({
    ingredientId: catalogId,
    name: item.ingredient.name,
    type: item.ingredient.category ?? 'additive',
    description: item.ingredient.description,
    safety: [item.ingredient.safetyLevel, ...(item.ingredient.ppe ?? [])]
      .filter(Boolean).join('; ') || 'Безопасность не указана.',
    percentage: Number(((item.massGrams / total) * 100).toFixed(2)),
  }));
  return { items: exportItems, skipped };
}

/** Категории lab-каталога → тип Recipe. Совпадение по сегментам продукта. */
const LAB_CATEGORY_TO_RECIPE: Record<string, Recipe['category']> = {
  water: 'hygiene', oil: 'hygiene', surfactant: 'hygiene',
  solvent: 'cleaning', pigment: 'cleaning', thickener: 'cleaning',
};

/**
 * Предлагает категорию рецепта по составу lab-формуляции:
 * берёт категорию самого массового ингредиента; при неоднозначности — 'hygiene'.
 */
export function suggestRecipeCategory(items: LabFormulationItem[]): Recipe['category'] {
  let best: Recipe['category'] | null = null;
  let bestMass = 0;
  for (const item of items) {
    if (item.massGrams <= 0) continue;
    const cat = LAB_CATEGORY_TO_RECIPE[item.ingredient.category ?? ''] ?? null;
    if (cat && item.massGrams > bestMass) {
      bestMass = item.massGrams;
      best = cat;
    }
  }
  return best ?? 'hygiene';
}
