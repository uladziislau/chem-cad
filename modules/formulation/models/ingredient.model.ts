export interface Ingredient {
  id: string;
  name: string;
  type: 'surfactant' | 'solvent' | 'fragrance' | 'preservative' | 'active' | 'base' | 'additive';
  description: string;
  safety: string;
  /** true для пользовательских ингредиентов (localStorage), false/undefined — встроенные */
  isCustom?: boolean;
}

export interface FormulationItem {
  ingredient: Ingredient;
  percentage: number;
}
