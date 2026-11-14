export interface RecipeIngredient {
  ingredientId: string;
  percentage: number;
  purpose: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: 'hygiene' | 'perfume' | 'cleaning';
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: RecipeIngredient[];
  steps: string[];
  safetyWarnings: string[];
  /** true для пользовательских рецептов (localStorage), false/undefined — встроенные */
  isCustom?: boolean;
}
