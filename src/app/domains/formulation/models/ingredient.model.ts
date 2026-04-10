export interface Ingredient {
  id: string;
  name: string;
  type: 'surfactant' | 'solvent' | 'fragrance' | 'preservative' | 'active' | 'base' | 'additive';
  description: string;
  safety: string;
}

export interface FormulationItem {
  ingredient: Ingredient;
  percentage: number;
}
