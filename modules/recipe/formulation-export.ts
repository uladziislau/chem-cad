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
