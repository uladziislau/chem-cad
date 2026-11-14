export type StateOfMatter = 'solid' | 'liquid' | 'gas' | 'aqueous';

export interface Reagent {
  id: string;
  name: string;
  formula: string;
  molarMass: number; // g/mol
  state: StateOfMatter;
  color: string;
  description: string;
}

export interface ReagentInFlask {
  reagent: Reagent;
  mass: number; // grams
  moles: number;
  concentration?: number; // mol/L (for aqueous)
}

export interface ReactionRule {
  id: string;
  reactants: { reagentId: string; coefficient: number }[];
  products: { reagentId: string; coefficient: number }[];
  energyChange: number; // kJ/mol
  visualEffect: 'none' | 'bubbles' | 'precipitate' | 'explosion' | 'color_change';
  resultColor?: string;
  description: string;
}

export interface FlaskState {
  contents: ReagentInFlask[];
  totalVolume: number; // mL
  temperature: number; // Celsius
  color: string;
  isExploded: boolean;
  activeEffect: 'none' | 'bubbles' | 'precipitate' | 'explosion' | 'color_change';
}
