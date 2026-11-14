import { describe, it, expect } from 'vitest';
import { Concentration } from '@domain/values/concentration';
import { HansenVector } from '@domain/values/hansen-vector';
import { AcidBaseProfile } from '@domain/values/acid-base-profile';
import { DropletSpectrum } from '@domain/values/droplet-spectrum';

describe('Domain Value Objects (Строгая типизация физико-химических величин)', () => {
  it('Concentration: должен корректно связывать молярность, массовую и мольную доли', () => {
    // 0.1 моль соли в 0.5 л раствора (масса соли 5.84г, общая масса 505.84г, всего молей 28)
    const conc = Concentration.fromMolesAndVolume(0.1, 0.5, 505.84, 5.84, 28);
    
    console.log(`[DOMAIN CONCENTRATION]: Molarity = ${conc.molarityMolPerL.toFixed(3)} M, Mass = ${conc.massFractionPercent.toFixed(2)}%`);
    expect(conc.molarityMolPerL).toBe(0.2);
    expect(conc.massFractionPercent).toBeCloseTo(1.15, 2);
  });

  it('HansenVector: должен рассчитывать Ra, Hildebrand и критерий смешиваемости RED', () => {
    const ethanol = new HansenVector(15.8, 8.8, 19.4);
    const isopropanol = new HansenVector(15.8, 6.1, 16.4);
    const hexane = new HansenVector(14.9, 0.0, 0.0);

    const redAlcohol = isopropanol.calculateRED(ethanol, 8.0);
    const redHexane = hexane.calculateRED(ethanol, 8.0);

    console.log(`[DOMAIN HANSEN VECTOR]:`);
    console.log(`  • Этанол Hildebrand δ_tot:    ${ethanol.totalHildebrand.toFixed(2)} MPa^0.5`);
    console.log(`  • RED (Изопропанол в этаноле): ${redAlcohol.toFixed(2)} (Смешиваемы)`);
    console.log(`  • RED (Гексан в этаноле):      ${redHexane.toFixed(2)} (Расслаиваются)`);

    expect(redAlcohol).toBeLessThan(1.0);
    expect(redHexane).toBeGreaterThan(1.0);
  });

  it('AcidBaseProfile: должен моделировать ступенчатую диссоциацию лимонной кислоты (pKa 3.13, 4.76, 6.40)', () => {
    const citricAcid = new AcidBaseProfile([3.13, 4.76, 6.40], false);

    const chargeAtPh2 = citricAcid.getNetChargeAtPH(2.0); // почти не диссоциирована (~0)
    const chargeAtPh5 = citricAcid.getNetChargeAtPH(5.0); // диссоциирована по 1-й и частично 2-й ступени (~ -1.6)
    const chargeAtPh8 = citricAcid.getNetChargeAtPH(8.0); // полностью диссоциирована в цитрат-анион (-3)

    console.log(`[DOMAIN ACID-BASE CITRIC ACID]:`);
    console.log(`  • Заряд при pH 2.0: ${chargeAtPh2.toFixed(2)}`);
    console.log(`  • Заряд при pH 5.0: ${chargeAtPh5.toFixed(2)} (Буферная зона кожи)`);
    console.log(`  • Заряд при pH 8.0: ${chargeAtPh8.toFixed(2)} (Тройной цитрат-анион)`);

    expect(chargeAtPh2).toBeCloseTo(-0.07, 1);
    expect(chargeAtPh5).toBeLessThan(-1.0);
    expect(chargeAtPh8).toBeCloseTo(-3.0, 1);
  });

  it('DropletSpectrum: должен рассчитывать полидисперсность Span и определять грубые эмульсии', () => {
    const fineSpectrum = new DropletSpectrum(0.8, 1.8, 2.0, 3.5);
    const coarseSpectrum = new DropletSpectrum(2.0, 15.0, 18.0, 32.0);

    console.log(`[DOMAIN DROPLET SPECTRUM]:`);
    console.log(`  • Тонкая эмульсия Span: ${fineSpectrum.polydispersitySpan.toFixed(2)}, Coarse: ${fineSpectrum.isCoarseEmulsion}`);
    console.log(`  • Грубая эмульсия Span: ${coarseSpectrum.polydispersitySpan.toFixed(2)}, Coarse: ${coarseSpectrum.isCoarseEmulsion}`);

    expect(fineSpectrum.polydispersitySpan).toBeCloseTo(1.35, 2);
    expect(fineSpectrum.isCoarseEmulsion).toBe(false);
    expect(coarseSpectrum.isCoarseEmulsion).toBe(true);
  });
});
