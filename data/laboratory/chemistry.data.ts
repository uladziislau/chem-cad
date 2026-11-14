import { Reagent, ReactionRule } from '@root-modules/laboratory/models/chemistry.model';

export const REAGENTS: Reagent[] = [
  // Базовые
  { id: 'water', name: 'Вода', formula: 'H₂O', molarMass: 18.015, state: 'liquid', color: 'rgba(200, 230, 255, 0.3)', description: 'Универсальный растворитель.' },
  { id: 'ethanol', name: 'Этиловый спирт', formula: 'C₂H₅OH', molarMass: 46.07, state: 'liquid', color: 'rgba(255, 255, 255, 0.1)', description: 'Растворитель, антисептик. Огнеопасен.' },
  { id: 'glycerin', name: 'Глицерин', formula: 'C₃H₈O₃', molarMass: 92.09, state: 'liquid', color: 'rgba(255, 255, 255, 0.2)', description: 'Вязкая гигроскопичная жидкость, увлажнитель.' },

  // Кислоты
  { id: 'hcl', name: 'Соляная кислота', formula: 'HCl', molarMass: 36.46, state: 'aqueous', color: 'rgba(240, 248, 255, 0.4)', description: 'Сильная кислота.' },
  { id: 'hno3', name: 'Азотная кислота', formula: 'HNO₃', molarMass: 63.01, state: 'aqueous', color: 'rgba(255, 255, 240, 0.5)', description: 'Сильная кислота, сильный окислитель.' },
  { id: 'acetic_acid', name: 'Уксусная кислота', formula: 'CH₃COOH', molarMass: 60.05, state: 'liquid', color: 'rgba(255, 255, 255, 0.3)', description: 'Слабая органическая кислота (уксус).' },
  { id: 'citric_acid', name: 'Лимонная кислота', formula: 'C₆H₈O₇', molarMass: 192.12, state: 'solid', color: 'rgba(255, 255, 255, 0.8)', description: 'Трикарбоновая кислота, регулятор pH.' },
  { id: 'sulfuric_acid', name: 'Серная кислота', formula: 'H₂SO₄', molarMass: 98.08, state: 'liquid', color: 'rgba(255, 255, 200, 0.6)', description: 'Сильная двухосновная кислота. Обезвоживает.' },

  // Щелочи и основания
  { id: 'naoh', name: 'Гидроксид натрия', formula: 'NaOH', molarMass: 39.997, state: 'aqueous', color: 'rgba(255, 255, 255, 0.4)', description: 'Сильное основание (щелочь).' },
  { id: 'nh3', name: 'Аммиак', formula: 'NH₃', molarMass: 17.03, state: 'gas', color: 'rgba(255, 255, 255, 0.3)', description: 'Щелочной газ с резким запахом.' },

  // Соли
  { id: 'nacl', name: 'Хлорид натрия', formula: 'NaCl', molarMass: 58.44, state: 'aqueous', color: 'rgba(240, 248, 255, 0.3)', description: 'Поваренная соль в растворе.' },
  { id: 'na2co3', name: 'Карбонат натрия', formula: 'Na₂CO₃', molarMass: 105.99, state: 'aqueous', color: 'rgba(255, 255, 255, 0.5)', description: 'Сода кальцинированная, щелочная соль.' },
  { id: 'nahco3', name: 'Гидрокарбонат натрия', formula: 'NaHCO₃', molarMass: 84.01, state: 'solid', color: 'rgba(255, 255, 255, 0.9)', description: 'Пищевая сода, слабое основание.' },
  { id: 'cu_no3_2', name: 'Нитрат меди(II)', formula: 'Cu(NO₃)₂', molarMass: 187.56, state: 'aqueous', color: 'rgba(0, 100, 255, 0.6)', description: 'Раствор голубого цвета.' },

  // Металлы
  { id: 'cu', name: 'Медь', formula: 'Cu', molarMass: 63.546, state: 'solid', color: '#b87333', description: 'Металлический порошок или стружка.' },
  { id: 'na', name: 'Натрий', formula: 'Na', molarMass: 22.99, state: 'solid', color: '#c0c0c0', description: 'Щелочной металл, крайне активен.' },
  { id: 'fe', name: 'Железо', formula: 'Fe', molarMass: 55.845, state: 'solid', color: '#8b8b8b', description: 'Металлический порошок или стружка.' },
  { id: 'zn', name: 'Цинк', formula: 'Zn', molarMass: 65.38, state: 'solid', color: '#a0a0a0', description: 'Металлический порошок.' },

  // Газы
  { id: 'h2', name: 'Водород', formula: 'H₂', molarMass: 2.016, state: 'gas', color: 'transparent', description: 'Легкий горючий газ.' },
  { id: 'o2', name: 'Кислород', formula: 'O₂', molarMass: 31.998, state: 'gas', color: 'transparent', description: 'Окислитель, поддерживает горение.' },
  { id: 'co2', name: 'Диоксид углерода', formula: 'CO₂', molarMass: 44.01, state: 'gas', color: 'transparent', description: 'Газ без цвета и запаха, тяжелее воздуха.' },
  { id: 'no2', name: 'Диоксид азота', formula: 'NO₂', molarMass: 46.005, state: 'gas', color: 'rgba(139, 69, 19, 0.7)', description: 'Бурый, токсичный газ.' },

  // Индикаторы и специальные
  { id: 'phenolphthalein', name: 'Фенолфталеин', formula: 'C₂₀H₁₄O₄', molarMass: 318.32, state: 'aqueous', color: 'rgba(255, 255, 255, 0.1)', description: 'Кислотно-основный индикатор.' },
  { id: 'pink_solution', name: 'Малиновый раствор', formula: 'Mix', molarMass: 318.32, state: 'aqueous', color: 'rgba(255, 20, 147, 0.6)', description: 'Фенолфталеин в щелочной среде.' },

  // ПАВ (для лаборатории мыла)
  { id: 'sls', name: 'Лаурилсульфат натрия', formula: 'C₁₂H₂₅NaO₄S', molarMass: 288.38, state: 'solid', color: 'rgba(255, 255, 255, 0.7)', description: 'Анионное ПАВ, пенообразователь.' },
  { id: 'coco_glucoside', name: 'Коко-глюкозид', formula: 'Mix', molarMass: 300.0, state: 'liquid', color: 'rgba(255, 255, 255, 0.3)', description: 'Неионогенное ПАВ из кокосового масла.' },

  // Эфирные масла (упрощённо)
  { id: 'lavender_oil', name: 'Масло лаванды', formula: 'Mix', molarMass: 200.0, state: 'liquid', color: 'rgba(180, 160, 255, 0.4)', description: 'Эфирное масло с успокаивающим ароматом.' },
  { id: 'lemon_oil', name: 'Масло лимона', formula: 'Mix', molarMass: 180.0, state: 'liquid', color: 'rgba(255, 255, 200, 0.4)', description: 'Эфирное масло с цитрусовым ароматом.' },
];

export const REACTION_RULES: ReactionRule[] = [
  {
    id: 'neutralization_hcl_naoh',
    reactants: [
      { reagentId: 'hcl', coefficient: 1 },
      { reagentId: 'naoh', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 1 },
      { reagentId: 'water', coefficient: 1 }
    ],
    energyChange: -57.3,
    visualEffect: 'none',
    resultColor: 'rgba(240, 248, 255, 0.3)',
    description: 'Нейтрализация: HCl + NaOH → NaCl + H₂O'
  },
  {
    id: 'neutralization_hno3_naoh',
    reactants: [
      { reagentId: 'hno3', coefficient: 1 },
      { reagentId: 'naoh', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 1 },
      { reagentId: 'water', coefficient: 1 }
    ],
    energyChange: -55.8,
    visualEffect: 'none',
    resultColor: 'rgba(240, 248, 255, 0.3)',
    description: 'Нейтрализация: HNO₃ + NaOH → NaNO₃ + H₂O (упрощённо NaCl)'
  },
  {
    id: 'acid_carbonate',
    reactants: [
      { reagentId: 'hcl', coefficient: 2 },
      { reagentId: 'nahco3', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 1 },
      { reagentId: 'co2', coefficient: 1 },
      { reagentId: 'water', coefficient: 1 }
    ],
    energyChange: -30.0,
    visualEffect: 'bubbles',
    resultColor: 'rgba(240, 248, 255, 0.3)',
    description: 'Кислота + сода: 2HCl + NaHCO₃ → NaCl + CO₂↑ + H₂O'
  },
  {
    id: 'acid_carbonate_na2co3',
    reactants: [
      { reagentId: 'hcl', coefficient: 2 },
      { reagentId: 'na2co3', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 2 },
      { reagentId: 'co2', coefficient: 1 },
      { reagentId: 'water', coefficient: 1 }
    ],
    energyChange: -25.0,
    visualEffect: 'bubbles',
    resultColor: 'rgba(240, 248, 255, 0.3)',
    description: 'Кислота + кальцинированная сода: 2HCl + Na₂CO₃ → 2NaCl + CO₂↑ + H₂O'
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
    id: 'copper_sulfuric_acid',
    reactants: [
      { reagentId: 'cu', coefficient: 1 },
      { reagentId: 'sulfuric_acid', coefficient: 2 }
    ],
    products: [
      { reagentId: 'cu_no3_2', coefficient: 1 },
      { reagentId: 'h2', coefficient: 1 },
      { reagentId: 'water', coefficient: 2 }
    ],
    energyChange: -100,
    visualEffect: 'bubbles',
    resultColor: 'rgba(0, 100, 255, 0.6)',
    description: 'Медь + серная кислота (конц.): Cu + 2H₂SO₄ → CuSO₄ + 2H₂O + SO₂'
  },
  {
    id: 'iron_sulfuric_acid',
    reactants: [
      { reagentId: 'fe', coefficient: 1 },
      { reagentId: 'hcl', coefficient: 2 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 2 },
      { reagentId: 'h2', coefficient: 1 }
    ],
    energyChange: -80,
    visualEffect: 'bubbles',
    resultColor: 'rgba(200, 200, 200, 0.4)',
    description: 'Железо + соляная кислота: Fe + 2HCl → FeCl₂ + H₂↑'
  },
  {
    id: 'zinc_hcl',
    reactants: [
      { reagentId: 'zn', coefficient: 1 },
      { reagentId: 'hcl', coefficient: 2 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 2 },
      { reagentId: 'h2', coefficient: 1 }
    ],
    energyChange: -65,
    visualEffect: 'bubbles',
    resultColor: 'rgba(200, 200, 200, 0.3)',
    description: 'Цинк + соляная кислота: Zn + 2HCl → ZnCl₂ + H₂↑'
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
    description: 'Натрий + вода: 2Na + 2H₂O → 2NaOH + H₂↑'
  },
  {
    id: 'sodium_acid',
    reactants: [
      { reagentId: 'na', coefficient: 2 },
      { reagentId: 'hcl', coefficient: 2 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 2 },
      { reagentId: 'h2', coefficient: 1 }
    ],
    energyChange: -200,
    visualEffect: 'explosion',
    resultColor: 'rgba(255, 255, 255, 0.3)',
    description: 'Натрий + кислота: 2Na + 2HCl → 2NaCl + H₂↑'
  },
  {
    id: 'ammonia_hcl',
    reactants: [
      { reagentId: 'nh3', coefficient: 1 },
      { reagentId: 'hcl', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 1 },
      { reagentId: 'water', coefficient: 1 }
    ],
    energyChange: -50,
    visualEffect: 'precipitate',
    resultColor: 'rgba(255, 255, 255, 0.6)',
    description: 'Аммиак + HCl: NH₃ + HCl → NH₄Cl (белый дым)'
  },
  {
    id: 'saponification',
    reactants: [
      { reagentId: 'sls', coefficient: 1 },
      { reagentId: 'naoh', coefficient: 1 }
    ],
    products: [
      { reagentId: 'nacl', coefficient: 1 },
      { reagentId: 'glycerin', coefficient: 1 }
    ],
    energyChange: -20,
    visualEffect: 'precipitate',
    resultColor: 'rgba(255, 255, 255, 0.5)',
    description: 'Омыление: SLS + NaOH → соль + глицерин'
  },
];
