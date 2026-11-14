export interface RecipeIngredient {
  ingredientId: string;
  percentage: number;
  purpose: string;
}

/** Шаг рецептуры: текст + опциональная привязка к ингредиентам и длительность. */
export interface RecipeStep {
  text: string;
  /** id ингредиентов, задействованных на этом шаге (опционально) */
  ingredientIds?: string[];
  /** длительность шага в минутах (опционально) */
  durationMinutes?: number;
}
export interface Recipe {
  id: string;
  name: string;
  category: 'hygiene' | 'perfume' | 'cleaning';
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  safetyWarnings: string[];
  /** true для пользовательских рецептов (localStorage), false/undefined — встроенные */
  isCustom?: boolean;
}
