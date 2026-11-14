import { describe, it, expect } from 'vitest';
import { ChemicalSpecies } from '../../core/domain/entities/chemical-species';
import { DomainPhase } from '../../core/domain/entities/domain-phase';
import { AcidBaseAspect } from '../../core/domain/aspects/acid-base.aspect';
import { AcidBaseProfile } from '../../core/domain/values/acid-base-profile';
import { PHEquilibriumService } from '../../core/domain/services/ph-equilibrium.service';

describe('Domain PHEquilibriumService (Строгий расчет кислотно-основного равновесия)', () => {
  const water = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0);
  
  // Лимонная кислота: молярная масса 192.12 г/моль, pKa: 3.13, 4.76, 6.40
  const citricAcid = new ChemicalSpecies('citric_acid', 'Лимонная кислота', 'Citric Acid', 192.12, 1.665)
    .withAspect(new AcidBaseAspect(new AcidBaseProfile([3.13, 4.76, 6.40], false)));

  // Гидроксид натрия (сильное основание): pKa ~ 13.8, молярная масса 40.0 г/моль
  const naoh = new ChemicalSpecies('naoh', 'Гидроксид натрия', 'Sodium Hydroxide', 40.0, 2.13)
    .withAspect(new AcidBaseAspect(new AcidBaseProfile([13.8], true)));

  it('должен рассчитывать равновесный pH раствора лимонной кислоты (~2.1 при 0.05M)', () => {
    const waterPhase = new DomainPhase('phase_w', 'Раствор лимонной кислоты');
    waterPhase.addComponent(water, 1000.0); // 1 литр воды
    waterPhase.addComponent(citricAcid, 9.6); // 9.6г = 0.05 моль

    const ph = PHEquilibriumService.calculateEquilibriumPH(waterPhase);
    console.log(`\n┌─ [EQUILIBRIUM pH] 0.05M Citric Acid: pH = ${ph.toFixed(2)} (Аналитическое совпадение)`);

    expect(ph).toBeGreaterThan(2.0);
    expect(ph).toBeLessThan(2.5);
  });

  it('должен моделировать буферный эффект при частичной нейтрализации щелочью', () => {
    const bufferPhase = new DomainPhase('buffer_w', 'Цитратный буфер для косметики');
    bufferPhase.addComponent(water, 1000.0);
    bufferPhase.addComponent(citricAcid, 19.2); // 0.1 моль кислоты
    bufferPhase.addComponent(naoh, 6.0);        // 0.15 моль NaOH (соотношение для зоны pH 4.5-5.5)

    const ph = PHEquilibriumService.calculateEquilibriumPH(bufferPhase);
    console.log(`┌─ [COSMETIC BUFFER pH] Citric Acid (0.1M) + NaOH (0.15M): pH = ${ph.toFixed(2)} (Идеально для кожи 4.5-5.5)`);

    expect(ph).toBeGreaterThan(4.5);
    expect(ph).toBeLessThan(5.5);
  });

  it('должен симулировать кривую титрования нейтрализации кислоты щелочью', () => {
    const initialPhase = new DomainPhase('titration_base', 'Титруемый раствор');
    initialPhase.addComponent(water, 100.0); // 100 мл
    initialPhase.addComponent(citricAcid, 1.92); // 0.01 моль (0.1 M, требует 30 мл 1.0M NaOH для полной нейтрализации)

    const points = PHEquilibriumService.simulateTitration(
      initialPhase,
      naoh,
      1.0,  // 1 M NaOH
      40.0, // до 40 мл NaOH (избыток щелочи)
      8
    );

    console.log(`\n┌─ [TITRATION CURVE] Нейтрализация 0.1M лимонной кислоты 1.0M раствором NaOH ──`);
    for (const pt of points) {
      const bar = '█'.repeat(Math.round(pt.ph * 2));
      console.log(`│ +${pt.titrantVolumeMl.toFixed(1).padStart(4)} мл NaOH ➔ pH ${pt.ph.toFixed(2).padStart(5)}  [${bar}]`);
    }
    console.log(`└─────────────────────────────────────────────────────────────────────────`);

    expect(points[0].ph).toBeLessThan(3.0);
    expect(points[points.length - 1].ph).toBeGreaterThan(11.0);
  });
});
