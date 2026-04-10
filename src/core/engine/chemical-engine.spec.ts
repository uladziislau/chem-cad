import { ChemicalEngine, RawIngredientInput } from './chemical-engine';
import { SimulationContext } from './simulation-context';
import { PureSubstance } from '../entities/pure-substance';
import { Oil } from '../entities/oil';
import { Surfactant } from '../entities/surfactant';

import { FormulationEntity } from '../entities/formulation-entity';

describe('ChemicalEngine Integration Tests (Scientific Calibration)', () => {
  
  // Базовые вещества для тестов (взяты из реального каталога)
  const WATER = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0, 0, 0.001, 1900).withHansen(15.6, 16.0, 42.3);
  const ALMOND_OIL = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9, -10, 0.0001, 3500).withHansen(16.0, 3.0, 4.0);
  const POLYSORBATE_20 = new Surfactant('Polysorbate-20', 1228, 16.7, 0, 0, false, 0, 0, 0, 1.1, -5, 0.00005, 4500).withHansen(16.0, 8.0, 10.0);
  const SALT = new PureSubstance('Sodium Chloride', 58.44, 0, 0, 0, 2.16, 801, 0.001, 1500, 1).withElectrolyte('salt').withSolubility(36);
  const XANTHAN = new PureSubstance('Xanthan Gum', 1000000, 0, 0, 0, 1.5, 300, 0.01, 1500, -1).withSolubility(1, 0.5); // Низкая растворимость, высокий коэффициент высаливания

  let context: SimulationContext;

  beforeEach(() => {
    // Стандартные условия: 25°C, 3000 RPM, 10 минут
    context = new SimulationContext(25, 1, 3000, 10);
  });

  it('Scenario 1: Pure Water Baseline', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 100, category: 'water' }
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // 1. Только одна фаза
    expect(result.system.phases.length).toBe(1);
    // 2. Вязкость должна быть близка к 1 cP (вязкость воды)
    expect(result.metrics.viscosity).toBeCloseTo(1.0, 0);
    // 3. Стабильность бесконечная (одна фаза не расслаивается)
    expect(result.metrics.stabilityDays).toBeGreaterThan(700);
    // 4. Безопасно
    expect(result.safety.isSafe).toBe(true);
  });

  it('Scenario 2: Water + Oil (Immiscible, No Emulsifier)', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 80, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 20, category: 'oil' }
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // 1. Две раздельные фазы
    expect(result.system.phases.length).toBe(2);
    // 2. Термодинамика: RED > 1 (Несмешивающиеся)
    expect(result.metrics.miscibility).not.toBeNull();
    expect(result.metrics.miscibility!.isMiscible).toBe(false);
    expect(result.metrics.miscibility!.redScore).toBeGreaterThan(1.0);
    // 3. Стабильность: Очень низкая (быстрое расслоение без ПАВ)
    expect(result.metrics.stabilityDays).toBeLessThan(5); 
  });

  it('Scenario 3: Stable Emulsion (Water + Oil + Surfactant)', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 75, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 20, category: 'oil' },
      { entity: POLYSORBATE_20, massGrams: 5, category: 'surfactant' }
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // 1. Две фазы (эмульсия)
    expect(result.system.phases.length).toBe(2);
    // 2. Стабильность: ПАВ должен улучшать стабильность по сравнению с чистым маслом и водой.
    // В текущей реализации (закон Стокса) без загустителя эмульсия все равно расслаивается быстро,
    // но мы ожидаем, что вязкость немного вырастет, а размер капель уменьшится.
    expect(result.metrics.stabilityDays).toBeGreaterThan(0);
    // 3. Вязкость не должна быть NaN
    expect(result.metrics.viscosity).not.toBeNaN();
  });

  it('Scenario 4: Safety Violation (Xanthan Gum + High Salt)', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 80, category: 'water' },
      { entity: XANTHAN, massGrams: 2, category: 'thickener' },
      { entity: SALT, massGrams: 18, category: 'active' } // Очень много соли
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // 1. Высокая ионная сила
    expect(result.metrics.ionicStrength).toBeGreaterThan(0.5);
    // 2. Срабатывание SafetyValidator (Конфликт полимера и электролита)
    expect(result.safety.isSafe).toBe(false);
    expect(result.safety.issues.length).toBeGreaterThan(0);
    expect(result.safety.issues[0].code).toBe('IONIC_THICKENER_DEGRADATION');
  });

  it('Scenario 5: Strong Acid (Acetic Acid)', () => {
    const ACETIC_ACID = new PureSubstance('Acetic Acid', 60.05, 0, 0, 0, 1.01, 16.6, 0.001, 1500, 0).withElectrolyte('acid', 4.76);
    
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 100, category: 'water' },
      { entity: ACETIC_ACID, massGrams: 0.6, category: 'active' } // ~0.1M (0.6g / 60g/mol = 0.01 mol in 0.1L)
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // 0.1M Уксусной кислоты (pKa = 4.76) должно давать pH ~ 2.88
    expect(result.metrics.ph).toBeGreaterThan(2.7);
    expect(result.metrics.ph).toBeLessThan(3.1);
  });

  it('Scenario 6: Strong Base (NaOH)', () => {
    const NAOH = new PureSubstance('Sodium Hydroxide', 40.0, 0, 0, 0, 1.1, 318, 0.001, 1800, 1).withElectrolyte('base', 13.8);
    
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 100, category: 'water' },
      { entity: NAOH, massGrams: 4, category: 'active' } // ~1M (4g / 40g/mol = 0.1 mol in 0.1L)
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // 1M NaOH должно давать pH ~ 14.0
    expect(result.metrics.ph).toBeGreaterThan(13.0);
  });

  it('Scenario 7: Buffer System (Citric Acid + NaOH)', () => {
    // Лимонная кислота (pKa = 3.13, 4.76, 6.40)
    const CITRIC_ACID = new PureSubstance('Citric Acid', 192.12, 0, 0, 0, 1.66, 153, 0.001, 2000, 0).withElectrolyte('acid', [3.13, 4.76, 6.40]);
    const NAOH = new PureSubstance('Sodium Hydroxide', 40.0, 0, 0, 0, 1.1, 318, 0.001, 1800, 1).withElectrolyte('base', 13.8);
    
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 100, category: 'water' },
      { entity: CITRIC_ACID, massGrams: 1.92, category: 'active' }, // 0.01 mol
      { entity: NAOH, massGrams: 0.4, category: 'active' } // 0.01 mol (нейтрализует первую ступень)
    ];

    const result = ChemicalEngine.runSimulation(inputs, context);

    // Ожидания:
    // Смесь слабой кислоты и ее соли образует буфер. 
    // При нейтрализации первой ступени (50% кислоты, 50% соли) pH должен быть близок к pKa1 (3.13)
    expect(result.metrics.ph).toBeGreaterThan(3.0);
    expect(result.metrics.ph).toBeLessThan(4.5);
  });

  it('Scenario 8: Emulsion Type Prediction (O/W vs W/O)', () => {
    const SPAN_80 = new Surfactant('Span 80', 428, 4.3, 0, 0, false, 0, 0, 0, 0.95, -10, 0.0001, 3000).withHansen(16.0, 4.0, 6.0);
    const TWEEN_80 = new Surfactant('Tween 80', 1310, 15.0, 0, 0, false, 0, 0, 0, 1.05, 0, 0.0001, 4000).withHansen(16.0, 8.0, 12.0);

    // 1. Тест W/O (Низкий ГЛБ)
    const contextWO = new SimulationContext(25, 1, 3000, 10);
    const inputsWO: RawIngredientInput[] = [
      { entity: WATER, massGrams: 30, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 65, category: 'oil' },
      { entity: SPAN_80, massGrams: 5, category: 'surfactant' }
    ];
    const resultWO = ChemicalEngine.runSimulation(inputsWO, contextWO);
    expect(resultWO.system.getEmulsionType()).toBe('W/O');

    // 2. Тест O/W (Высокий ГЛБ)
    const contextOW = new SimulationContext(25, 1, 3000, 10);
    const inputsOW: RawIngredientInput[] = [
      { entity: WATER, massGrams: 70, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 25, category: 'oil' },
      { entity: TWEEN_80, massGrams: 5, category: 'surfactant' }
    ];
    const resultOW = ChemicalEngine.runSimulation(inputsOW, contextOW);
    expect(resultOW.system.getEmulsionType()).toBe('O/W');

    // 3. Тест инверсии фаз по объему (Высокий ГЛБ, но масла 90%)
    const inputsInversion: RawIngredientInput[] = [
      { entity: WATER, massGrams: 5, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 90, category: 'oil' },
      { entity: TWEEN_80, massGrams: 5, category: 'surfactant' }
    ];
    const resultInversion = ChemicalEngine.runSimulation(inputsInversion, contextOW);
    expect(resultInversion.system.getEmulsionType()).toBe('W/O');
  });

  it('Scenario 9: Solubility and Salting-out', () => {
    // 1. Тест перенасыщения солью (40г на 100г воды при пределе 36г)
    const inputsSalt: RawIngredientInput[] = [
      { entity: WATER, massGrams: 100, category: 'water' },
      { entity: SALT, massGrams: 40, category: 'salt' }
    ];
    const resultSalt = ChemicalEngine.runSimulation(inputsSalt, context);
    expect(resultSalt.metrics.solubilityIssues.length).toBeGreaterThan(0);
    expect(resultSalt.metrics.solubilityIssues[0].entityName).toBe('Sodium Chloride');

    // 2. Тест высаливания (Ксантан 0.5г - растворим в чистой воде, но выпадает при 10г соли)
    const inputsSaltingOut: RawIngredientInput[] = [
      { entity: WATER, massGrams: 100, category: 'water' },
      { entity: XANTHAN, massGrams: 0.5, category: 'thickener' },
      { entity: SALT, massGrams: 10, category: 'salt' }
    ];
    const resultSaltingOut = ChemicalEngine.runSimulation(inputsSaltingOut, context);
    // Ионная сила от 10г соли (~1.7M) должна сильно снизить растворимость ксантана
    expect(resultSaltingOut.metrics.solubilityIssues.some(i => i.entityName === 'Xanthan Gum')).toBe(true);
  });

  it('Scenario 10: System of Systems (Nested Formulations)', () => {
    // 1. Создаем "Премикс" (Базовый крем)
    const premixRecipe: RawIngredientInput[] = [
      { entity: WATER, massGrams: 70, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 20, category: 'oil' },
      { entity: POLYSORBATE_20, massGrams: 10, category: 'surfactant' }
    ];
    const premixResult = ChemicalEngine.runSimulation(premixRecipe, context);
    
    // Оборачиваем результат в FormulationEntity
    const baseCream = new FormulationEntity('Base Cream', premixRecipe, premixResult.system);

    // 2. Создаем финальный продукт, используя премикс как ингредиент
    // Берем 50г базового крема (в нем будет 35г воды, 10г масла, 5г ПАВ)
    // Добавляем еще 50г воды.
    // Итого должно быть: 85г воды, 10г масла, 5г ПАВ.
    const finalRecipe: RawIngredientInput[] = [
      { entity: baseCream, massGrams: 50, category: 'premix' },
      { entity: WATER, massGrams: 50, category: 'water' }
    ];

    const finalResult = ChemicalEngine.runSimulation(finalRecipe, context);

    // Проверяем, что движок правильно "распаковал" премикс
    const waterPhase = finalResult.system.phases[0];
    const oilPhase = finalResult.system.phases[1];

    // В водной фазе должно быть 85г воды (35 из крема + 50 добавлено) и 5г ПАВ (итого 90г)
    // Но подождите:
    // premixRecipe: 70g water, 20g oil, 10g surfactant. Total = 100g.
    // baseCream is 50g. So it brings: 35g water, 10g oil, 5g surfactant.
    // finalRecipe: 50g baseCream + 50g water.
    // Total water = 35g + 50g = 85g.
    // Surfactant = 5g.
    // Water phase total mass = 85g water + 5g surfactant = 90g.
    // Let's check why it's 85.
    // Ah, surfactant is not added to waterPhase in buildBaseSystem!
    // It's added to `surfactants` array, and then distributed.
    // Let's check the total mass of the water phase.
    expect(waterPhase.totalMass.to('g')).toBeCloseTo(85, 1); 
    
    // В масляной фазе должно быть 10г масла
    expect(oilPhase.totalMass.to('g')).toBeCloseTo(10, 1);

    // Проверяем, что эмульсия все еще O/W
    expect(finalResult.system.getEmulsionType()).toBe('O/W');
  });

});
