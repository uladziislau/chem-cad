import { describe, it, expect } from 'vitest';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Mixture } from '@domain/entities/mixture';
import { Moles } from '@root-modules/units/quantities';
import { IActivityModel } from '@root-modules/thermodynamics/activity-model.interface';
import { MiscibilitySolver } from '@root-modules/solvers/miscibility-solver';
import { HansenParameters } from '@root-modules/thermodynamics/hansen-parameters';

describe('Thermodynamics Integration (Неидеальные смеси и смешиваемость Хансена)', () => {
  const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
  const ethanol = new PureSubstance('Ethanol', 46.07, 8.20417, 1642.89, 230.300, 0.789);

  it('должен учитывать коэффициенты активности (γ) в уравнении Рауля-Дальтона', () => {
    const mixture = new Mixture();
    mixture.addComponent(water, new Moles(0.5, 'mol'));
    mixture.addComponent(ethanol, new Moles(0.5, 'mol'));

    const t = 78;
    const idealPressure = mixture.getVaporPressure(t);

    const nonIdealModel: IActivityModel = {
      getActivityCoefficients: () => new Map([[water, 1.2], [ethanol, 1.2]])
    };

    mixture.setActivityModel(nonIdealModel);
    const nonIdealPressure = mixture.getVaporPressure(t);

    console.log(`[VAPOR PRESSURE @ 78°C] Водно-спиртовая смесь (x_w=0.5, x_eth=0.5):`);
    console.log(`  • Идеальное (Закон Рауля):      ${idealPressure.toFixed(2)} mmHg`);
    console.log(`  • Неидеальное (γ=1.2, азеотроп): ${nonIdealPressure.toFixed(2)} mmHg [Δ +${(nonIdealPressure - idealPressure).toFixed(2)} mmHg]`);

    expect(nonIdealPressure).toBeGreaterThan(idealPressure);
  });

  it('должен рассчитывать термодинамическую смешиваемость по Хансену (RED Score)', () => {
    // Этанол vs Изопропанол (смешиваются) vs Минеральное масло (расслаиваются)
    const ethanolHansen = new HansenParameters(15.8, 8.8, 19.4);
    const isopropanolHansen = new HansenParameters(15.8, 6.1, 16.4);
    const oilHansen = new HansenParameters(16.0, 1.0, 1.0);

    const ethanolIsopropanol = MiscibilitySolver.calculateMiscibility(isopropanolHansen, ethanolHansen, 8.0);
    const ethanolOil = MiscibilitySolver.calculateMiscibility(oilHansen, ethanolHansen, 8.0);

    console.log(`[HANSEN SOLUBILITY PARAMETERS]:`);
    console.log(`  • Этанол + Изопропанол: RED = ${ethanolIsopropanol.redScore.toFixed(2)} (Miscible: ${ethanolIsopropanol.isMiscible})`);
    console.log(`  • Этанол + Масло:       RED = ${ethanolOil.redScore.toFixed(2)} (Miscible: ${ethanolOil.isMiscible})`);

    expect(ethanolIsopropanol.isMiscible).toBe(true);
    expect(ethanolIsopropanol.redScore).toBeLessThan(1.0);
    expect(ethanolOil.isMiscible).toBe(false);
    expect(ethanolOil.redScore).toBeGreaterThan(1.0);
  });
});
