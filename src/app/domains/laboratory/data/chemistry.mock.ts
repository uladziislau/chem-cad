import { Reagent, ReactionRule } from '../models/chemistry.model';

export const REAGENTS: Reagent[] = [
  { id: 'water', name: 'Вода', formula: 'H₂O', molarMass: 18.015, state: 'liquid', color: 'rgba(200, 230, 255, 0.3)', description: 'Универсальный растворитель.' },
  { id: 'hcl', name: 'Соляная кислота', formula: 'HCl', molarMass: 36.46, state: 'aqueous', color: 'rgba(240, 248, 255, 0.4)', description: 'Сильная кислота.' },
  { id: 'naoh', name: 'Гидроксид натрия', formula: 'NaOH', molarMass: 39.997, state: 'aqueous', color: 'rgba(255, 255, 255, 0.4)', description: 'Сильное основание (щелочь).' },
  { id: 'nacl', name: 'Хлорид натрия', formula: 'NaCl', molarMass: 58.44, state: 'aqueous', color: 'rgba(240, 248, 255, 0.3)', description: 'Поваренная соль в растворе.' },
  { id: 'cu', name: 'Медь', formula: 'Cu', molarMass: 63.546, state: 'solid', color: '#b87333', description: 'Металлический порошок или стружка.' },
  { id: 'hno3', name: 'Азотная кислота', formula: 'HNO₃', molarMass: 63.01, state: 'aqueous', color: 'rgba(255, 255, 240, 0.5)', description: 'Сильная кислота, сильный окислитель.' },
  { id: 'cu_no3_2', name: 'Нитрат меди(II)', formula: 'Cu(NO₃)₂', molarMass: 187.56, state: 'aqueous', color: 'rgba(0, 100, 255, 0.6)', description: 'Раствор голубого цвета.' },
  { id: 'no2', name: 'Диоксид азота', formula: 'NO₂', molarMass: 46.005, state: 'gas', color: 'rgba(139, 69, 19, 0.7)', description: 'Бурый, токсичный газ ("лисий хвост").' },
  { id: 'phenolphthalein', name: 'Фенолфталеин', formula: 'C₂₀H₁₄O₄', molarMass: 318.32, state: 'aqueous', color: 'rgba(255, 255, 255, 0.1)', description: 'Кислотно-основный индикатор.' },
  { id: 'pink_solution', name: 'Малиновый раствор', formula: 'Mix', molarMass: 318.32, state: 'aqueous', color: 'rgba(255, 20, 147, 0.6)', description: 'Фенолфталеин в щелочной среде.' },
  { id: 'na', name: 'Натрий', formula: 'Na', molarMass: 22.99, state: 'solid', color: '#c0c0c0', description: 'Щелочной металл, крайне активен.' },
  { id: 'h2', name: 'Водород', formula: 'H₂', molarMass: 2.016, state: 'gas', color: 'transparent', description: 'Легкий горючий газ.' },
];

export const REACTION_RULES: ReactionRule[] = [
  {
    id: 'neutralization',
    reactants: [
      { reagentId: 'hcl', coefficient: 1 },
      { reagentId: 'naoh', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 1 },
      { reagentId: 'water', coefficient: 1 }
    ],
    energyChange: -57.3, // kJ/mol (exothermic)
    visualEffect: 'none',
    resultColor: 'rgba(240, 248, 255, 0.3)',
    description: 'Реакция нейтрализации: HCl + NaOH → NaCl + H₂O'
  },
  {
    id: 'copper_nitric_acid',
    reactants: [
      { reagentId: 'cu', coefficient: 1 },
      { reagentId: 'hno3', coefficient: 4 }
    ],
    products: [
      { reagentId: 'cu_no3_2', coefficient: 1 },
      { reagentId: 'no2', coefficient: 2 },
      { reagentId: 'water', coefficient: 2 }
    ],
    energyChange: -150,
    visualEffect: 'bubbles',
    resultColor: 'rgba(0, 100, 255, 0.6)',
    description: 'Окисление меди: Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂ + 2H₂O'
  },
  {
    id: 'sodium_water',
    reactants: [
      { reagentId: 'na', coefficient: 2 },
      { reagentId: 'water', coefficient: 2 }
    ],
    products: [
      { reagentId: 'naoh', coefficient: 2 },
      { reagentId: 'h2', coefficient: 1 }
    ],
    energyChange: -368,
    visualEffect: 'explosion',
    resultColor: 'rgba(255, 255, 255, 0.4)',
    description: 'Реакция натрия с водой: 2Na + 2H₂O → 2NaOH + H₂'
  }
];
