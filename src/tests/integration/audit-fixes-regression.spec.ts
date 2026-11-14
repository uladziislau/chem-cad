import { describe, it, expect } from 'vitest';
import { ChemicalEngine, RawIngredientInput } from '../../core/engine/chemical-engine';
import { SimulationContext } from '../../core/engine/simulation-context';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Oil } from '../../core/entities/oil';
import { Surfactant } from '../../core/entities/surfactant';
import {
  ChemicalSpecies,
  DomainPhase,
  DomainPhaseBoundary,
  ColloidalSystem,
  SurfaceActiveAspect,
  AcidBaseAspect,
  AcidBaseProfile,
  ElectrolyteAspect,
  LipophilicAspect,
  PHEquilibriumService,
  NonNewtonianRheologyService,
  ColloidalStabilityService
} from '../../core/domain';

describe('Audit Regression Suite (Верификация исправлений 11 выявленных дефектов)', () => {
  const WATER = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0, 0, 0.001, 1900).withHansen(15.6, 16.0, 42.3);
  const ALMOND_OIL = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9, -10, 0.0005, 3600, 0, 12).withHansen(16.0, 3.0, 4.0);
  const TWEEN_80 = new Surfactant('Tween 80', 1310, 15.0, 45, 2, true, 0, 0, 0, 1.08, 0, 0.0001, 4000, 0, -2.0);
  const SPAN_80 = new Surfactant('Span 80', 428.6, 4.3, 15, 1, true, 0, 0, 0, 0.99, -10, 0.0001, 3500, 0, 3.5);
  const SALT = new PureSubstance('Sodium Chloride', 58.44, 0, 0, 0, 2.16, 801, 0.001, 1500, 1).withElectrolyte('salt');
  const XANTHAN = new PureSubstance('Xanthan Gum', 1000000, 0, 0, 0, 1.5, 300, 0.01, 1500, -1).withSolubility(1, 0.5);

  it('1. Солевой раствор с NaCl (Tm=801°C) и ксантаном НЕ должен замерзать при 25°C', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 80, category: 'water' },
      { entity: XANTHAN, massGrams: 2, category: 'thickener' },
      { entity: SALT, massGrams: 18, category: 'active' }
    ];
    const result = ChemicalEngine.runSimulation(inputs, new SimulationContext(25, 1, 1000, 5));
    const phase = result.system.phases[0];
    const tm = phase.composition.getMeltingPoint();

    console.log(`\n[FIX #1 FREEZE LOCK] Вода 80г + NaCl 18г + Ксантан 2г @ 25°C:`);
    console.log(`  • Точка замерзания смеси: ${tm.toFixed(2)} °C (Криоскопический сдвиг < 0°C)`);
    console.log(`  • Фаза твердая (isSolid): ${phase.isSolid()}, Вязкость: ${result.metrics.viscosity.toFixed(2)} cP`);

    expect(tm).toBeLessThan(0);
    expect(phase.isSolid()).toBe(false);
    expect(result.metrics.viscosity).toBeLessThan(100);
  });

  it('2. Двухфазная эмульсия должна сохранять полную массу (100г) и рассчитывать ненулевой HLB ПАВ', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 75, category: 'water' },
      { entity: ALMOND_OIL, massGrams: 20, category: 'oil' },
      { entity: TWEEN_80, massGrams: 5, category: 'surfactant' }
    ];
    const result = ChemicalEngine.runSimulation(inputs, new SimulationContext(25, 1, 3000, 10));
    const totalMassG = result.system.getTotalMass().to('g');

    console.log(`\n[FIX #2 MASS & HLB] Эмульсия 75г воды + 20г масла + 5г Tween 80:`);
    console.log(`  • Суммарная масса системы: ${totalMassG.toFixed(1)} г (ожидалось 100.0 г)`);
    console.log(`  • Фактический HLB ПАВ:     ${result.metrics.actualHLB.toFixed(2)} (ожидалось 15.00)`);

    expect(totalMassG).toBeCloseTo(100.0, 2);
    expect(result.metrics.actualHLB).toBeCloseTo(15.0, 1);
    expect(result.metrics.stabilityDays).toBeGreaterThan(0);
  });

  it('3. Однофазная система со смесью двух ПАВ должна сохранять оба ПАВ и их общую массу', () => {
    const inputs: RawIngredientInput[] = [
      { entity: WATER, massGrams: 85, category: 'water' },
      { entity: TWEEN_80, massGrams: 10, category: 'surfactant' },
      { entity: SPAN_80, massGrams: 5, category: 'surfactant' }
    ];
    const result = ChemicalEngine.runSimulation(inputs, new SimulationContext(25, 1, 500, 5));
    const totalMassG = result.system.getTotalMass().to('g');

    console.log(`\n[FIX #3 MULTI-SURF SINGLE PHASE] Шампунь/раствор 85г воды + 10г Tween 80 + 5г Span 80:`);
    console.log(`  • Масса фазы: ${result.system.phases[0].totalMass.to('g').toFixed(1)} г, Смешанный HLB: ${result.metrics.actualHLB.toFixed(2)}`);

    expect(result.system.phases.length).toBe(1);
    expect(totalMassG).toBeCloseTo(100.0, 2);
    expect(result.metrics.actualHLB).toBeLessThan(15.0);
    expect(result.metrics.actualHLB).toBeGreaterThan(4.3);
  });

  it('4. Обратная эмульсия W/O должна считать вязкость по маслу (сплошной фазе), а при 0 RPM капли не мельчаются', () => {
    const viscousOil = new Oil('Heavy Emollient', 800, 6.0, 0, 0, false, 0, 0, 0, 0.92, -10, 0.005, 3600, 0, 14);
    const inputsWO: RawIngredientInput[] = [
      { entity: WATER, massGrams: 30, category: 'water' },
      { entity: viscousOil, massGrams: 65, category: 'oil' },
      { entity: SPAN_80, massGrams: 5, category: 'surfactant' }
    ];

    const resMixed = ChemicalEngine.runSimulation(inputsWO, new SimulationContext(25, 1, 3000, 10));
    const resStatic = ChemicalEngine.runSimulation(inputsWO, new SimulationContext(25, 1, 0, 10));
    const oilViscosity = resMixed.system.phases[1].getViscosity();

    console.log(`\n[FIX #4 DAG ORDER & 0 RPM] Обратная эмульсия W/O (вязкость масла = ${oilViscosity.toFixed(1)} cP):`);
    console.log(`  • Тип эмульсии: ${resMixed.system.getEmulsionType()}, Вязкость W/O: ${resMixed.metrics.viscosity.toFixed(1)} cP`);
    console.log(`  • Капли при 3000 RPM: ${resMixed.system.getDropletSize().toFixed(1)} мкм | при 0 RPM: ${resStatic.system.getDropletSize().toFixed(1)} мкм`);

    expect(resMixed.system.getEmulsionType()).toBe('W/O');
    expect(resMixed.metrics.viscosity).toBeGreaterThan(oilViscosity);
    expect(resStatic.system.getDropletSize()).toBe(200.0);
  });

  it('5. Масштабная инвариантность изотермы Гиббса-Шишковского (100г vs 10кг) в DomainPhaseBoundary', () => {
    const water = new ChemicalSpecies('w', 'Вода', 'Aqua', 18.015, 1.0);
    const oil = new ChemicalSpecies('o', 'Масло', 'Oil', 800, 0.9);
    const tween = new ChemicalSpecies('tw', 'Tween 80', 'Polysorbate 80', 1310, 1.08)
      .withAspect(new SurfaceActiveAspect('nonionic', 0.000012, -2.0, 15.0));

    const buildBoundary = (scale: number): number => {
      const pW = new DomainPhase('w', 'Water');
      pW.addComponent(water, 75 * scale);
      const pO = new DomainPhase('o', 'Oil');
      pO.addComponent(oil, 20 * scale);
      const b = new DomainPhaseBoundary(pW, pO, 48.0);
      b.adsorbSurfactant(tween, (5 * scale) / 1310);
      return b.getInterfacialTension();
    };

    const ift100g = buildBoundary(1);
    const ift10kg = buildBoundary(100);

    console.log(`\n[FIX #5 SCALE INVARIANCE IFT]:`);
    console.log(`  • Партия 100 г:   IFT = ${ift100g.toFixed(4)} мН/м`);
    console.log(`  • Партия 10 000 г: IFT = ${ift10kg.toFixed(4)} мН/м [Δ = ${Math.abs(ift100g - ift10kg).toExponential(2)}]`);

    expect(ift100g).toBeLessThan(48.0);
    expect(ift100g).toBeGreaterThan(1.0);
    expect(ift100g).toBeCloseTo(ift10kg, 6);
  });

  it('6. Полиномиальное распределение ионных форм α_k в AcidBaseProfile и разбавление при титровании', () => {
    const citricProfile = new AcidBaseProfile([3.13, 4.76, 6.40], false);
    const fracsAtMid = citricProfile.getSpeciesFractions(4.76);
    const sumFracs = fracsAtMid.reduce((a, b) => a + b, 0);
    const extremeCharge0 = citricProfile.getNetChargeAtPH(0);
    const extremeCharge14 = citricProfile.getNetChargeAtPH(14);

    // Проверка титрования с учетом роста объема от добавленного титранта
    const water = new ChemicalSpecies('w', 'Вода', 'Aqua', 18.015, 1.0);
    const citric = new ChemicalSpecies('ca', 'Лимонная кислота', 'Citric Acid', 192.12, 1.66)
      .withAspect(new AcidBaseAspect(citricProfile));
    const naoh = new ChemicalSpecies('naoh', 'NaOH', 'Sodium Hydroxide', 40.0, 2.13)
      .withAspect(new AcidBaseAspect(new AcidBaseProfile([13.8], true)));

    const phase = new DomainPhase('titrate', 'Раствор');
    phase.addComponent(water, 100.0);
    phase.addComponent(citric, 1.92);

    const curve = PHEquilibriumService.simulateTitration(phase, naoh, 1.0, 40.0, 4);

    console.log(`\n[FIX #6 POLYPROTIC & TITRATION]:`);
    console.log(`  • Доли цитрата при pH = 4.76 (pKa2): [${fracsAtMid.map(f => f.toFixed(3)).join(', ')}], Σ = ${sumFracs.toFixed(6)}`);
    console.log(`  • Заряд при pH=0: ${extremeCharge0.toFixed(4)}, при pH=14: ${extremeCharge14.toFixed(4)}`);
    console.log(`  • Титрование: 0мл -> pH ${curve[0].ph.toFixed(2)}, +40мл -> pH ${curve[curve.length - 1].ph.toFixed(2)}`);

    expect(sumFracs).toBeCloseTo(1.0, 8);
    expect(fracsAtMid[1]).toBeCloseTo(fracsAtMid[2], 6); // при pH = pKa2 концентрации H2A- и HA2- строго равны!
    expect(Number.isFinite(extremeCharge0)).toBe(true);
    expect(extremeCharge14).toBeCloseTo(-3.0, 4);
    expect(curve[curve.length - 1].ph).toBeGreaterThan(11.5);
  });

  it('7. Стесненная реология Кригера-Догерти (φ > 0.55) и катастрофическая инверсия при φ > 0.74', () => {
    const water = new ChemicalSpecies('w', 'Вода', 'Aqua', 18.015, 1.0);
    const oil = new ChemicalSpecies('o', 'Каприлик триглицерид', 'Caprylic Triglyceride', 408, 1.0)
      .withAspect(new LipophilicAspect(9.0, 5.0));
    const tween = new ChemicalSpecies('tw', 'Tween 80', 'Polysorbate 80', 1310, 1.08)
      .withAspect(new SurfaceActiveAspect('nonionic', 0.000012, -2.0, 15.0));

    const makeEmulsion = (waterG: number, oilG: number): ColloidalSystem => {
      const pW = new DomainPhase('w', 'Вода');
      pW.addComponent(water, waterG);
      const pO = new DomainPhase('o', 'Масло');
      pO.addComponent(oil, oilG);
      const b = new DomainPhaseBoundary(pW, pO);
      b.adsorbSurfactant(tween, 0.002);
      return new ColloidalSystem([pW, pO], [b]);
    };

    const dilute = makeEmulsion(70, 30);      // φ_oil = 0.30 -> O/W
    const concentrated = makeEmulsion(35, 65); // φ_oil = 0.65 > 0.55 -> O/W HIPE
    const inverted = makeEmulsion(20, 80);    // φ_oil = 0.80 > 0.74 -> Катастрофическая инверсия в W/O!

    const profDilute = NonNewtonianRheologyService.calculateSystemProfile(dilute, { ph: 6.5 });
    const profConc = NonNewtonianRheologyService.calculateSystemProfile(concentrated, { ph: 6.5 });

    console.log(`\n[FIX #7 CROWDING & PHASE INVERSION]:`);
    console.log(`  • φ=0.30 (${dilute.getMorphology()}): τ0 = ${profDilute.yieldStressPa.toFixed(2)} Па, η(10 с^-1) = ${profDilute.getApparentViscosityCp(10).toFixed(0)} сП`);
    console.log(`  • φ=0.65 (${concentrated.getMorphology()}): τ0 = ${profConc.yieldStressPa.toFixed(2)} Па, η(10 с^-1) = ${profConc.getApparentViscosityCp(10).toFixed(0)} сП [Стесненное течение!]`);
    console.log(`  • φ=0.80 (${inverted.getMorphology()}): Катастрофическая инверсия при φ > 0.74`);

    expect(dilute.getMorphology()).toBe('O/W');
    expect(concentrated.getMorphology()).toBe('O/W');
    expect(inverted.getMorphology()).toBe('W/O');
    expect(profConc.yieldStressPa).toBeGreaterThan(0);
    expect(profConc.getApparentViscosityCp(10)).toBeGreaterThan(profDilute.getApparentViscosityCp(10) * 5);
  });

  it('8. Автоопределение ионной силы NaCl в DLVO и зависимость HLD от EACN, соли и температуры', () => {
    const water = new ChemicalSpecies('w', 'Вода', 'Aqua', 18.015, 1.0);
    const nacl = new ChemicalSpecies('nacl', 'Хлорид натрия', 'Sodium Chloride', 58.44, 2.16)
      .withAspect(new ElectrolyteAspect(1, 1, 1, 1));
    const squalane = new ChemicalSpecies('sq', 'Сквалан', 'Squalane', 422.8, 0.81)
      .withAspect(new LipophilicAspect(24.0, 7.0));
    const nonionic = new ChemicalSpecies('peg', 'PEG-20', 'Laureth-20', 1000, 1.05)
      .withAspect(new SurfaceActiveAspect('nonionic', 0.0001, -1.5, 16.0));

    const pW = new DomainPhase('w', 'Вода', 25);
    pW.addComponent(water, 95);
    pW.addComponent(nacl, 5); // ~0.9M NaCl
    const pO = new DomainPhase('o', 'Сквалан', 25);
    pO.addComponent(squalane, 20);
    const b = new DomainPhaseBoundary(pW, pO);
    b.adsorbSurfactant(nonionic, 0.003);

    const sys = new ColloidalSystem([pW, pO], [b]);
    const hld25 = sys.calculateHLD({ temperatureCelsius: 25 });
    const hld60 = sys.calculateHLD({ temperatureCelsius: 60 });
    const dlvoAuto = ColloidalStabilityService.evaluateDLVO(sys, { ph: 7.0 });

    console.log(`\n[FIX #8 HLD(EACN,S,T) & AUTO IONIC DLVO]:`);
    console.log(`  • HLD @ 25°C: ${hld25.toFixed(2)} -> HLD @ 60°C (PIT сдвиг неионного ПАВ): ${hld60.toFixed(2)}`);
    console.log(`  • Автоматический Дебай κ^-1 (5% NaCl): ${dlvoAuto.debyeLengthNm.toFixed(3)} нм, Барьер = ${dlvoAuto.energyBarrierKbT.toFixed(1)} kBT`);

    expect(hld60).toBeGreaterThan(hld25);
    expect(dlvoAuto.debyeLengthNm).toBeLessThan(0.5);
  });
});
