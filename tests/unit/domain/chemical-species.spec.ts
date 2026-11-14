import { describe, it, expect } from 'vitest';
import { ChemicalSpecies } from '@domain/entities/chemical-species';
import { AcidBaseAspect } from '@domain/aspects/acid-base.aspect';
import { AcidBaseProfile } from '@domain/values/acid-base-profile';
import { SurfaceActiveAspect } from '@domain/aspects/surface-active.aspect';
import { VolatilityAspect } from '@domain/aspects/volatility.aspect';
import { HansenSolubilityAspect } from '@domain/aspects/hansen-solubility.aspect';
import { HansenVector } from '@domain/values/hansen-vector';

describe('Domain ChemicalSpecies (Компонентная модель полифункциональных молекул)', () => {
  it('должен моделировать Лимонную Кислоту (хелатор, буфер и растворитель)', () => {
    const citricAcid = new ChemicalSpecies(
      'citric_acid',
      'Лимонная кислота',
      'Citric Acid',
      192.12,
      1.665,
      '77-92-9'
    );

    citricAcid.withAspect(new AcidBaseAspect(new AcidBaseProfile([3.13, 4.76, 6.40], false)));
    citricAcid.withAspect(new HansenSolubilityAspect(new HansenVector(17.0, 13.0, 20.0)));

    console.log(`[DOMAIN SPECIES] ${citricAcid.name} (${citricAcid.inciName}):`);
    console.log(`  • Молярная масса: ${citricAcid.molarMassGPerMol} г/моль`);
    console.log(`  • Зарегистрированные аспекты: ${citricAcid.getAllAspectTypes().join(', ')}`);

    expect(citricAcid.hasAspect(AcidBaseAspect.TYPE)).toBe(true);
    expect(citricAcid.hasAspect(HansenSolubilityAspect.TYPE)).toBe(true);
    expect(citricAcid.hasAspect(SurfaceActiveAspect.TYPE)).toBe(false);

    const acidAspect = citricAcid.getAspect<AcidBaseAspect>(AcidBaseAspect.TYPE);
    expect(acidAspect?.pKaValues.length).toBe(3);
    expect(acidAspect?.getChargeAtPH(5.0)).toBeLessThan(-1.0);
  });

  it('должен моделировать анионный ПАВ SLES (поверхностная активность + диссоциация)', () => {
    const sles = new ChemicalSpecies(
      'sles_70',
      'Лауретсульфат натрия',
      'Sodium Laureth Sulfate',
      288.38,
      1.05,
      '9004-82-4'
    );

    sles.withAspect(new SurfaceActiveAspect('anionic', 0.0012, -3.5, 40.0));
    sles.withAspect(new HansenSolubilityAspect(new HansenVector(16.0, 10.0, 12.0)));

    const surfAspect = sles.getAspect<SurfaceActiveAspect>(SurfaceActiveAspect.TYPE);
    console.log(`[DOMAIN SPECIES SLES]: CMC = ${surfAspect?.cmcMolesPerLiter} mol/L, Cc = ${surfAspect?.characteristicCurvatureCc}`);

    expect(surfAspect?.surfactantType).toBe('anionic');
    expect(surfAspect?.hlbGriffin).toBe(40.0);
  });

  it('должен моделировать летучий растворитель Этанол с давлением пара по Антуану', () => {
    const ethanol = new ChemicalSpecies(
      'ethanol',
      'Этанол',
      'Alcohol',
      46.07,
      0.789,
      '64-17-5'
    );

    ethanol.withAspect(new VolatilityAspect(8.20417, 1642.89, 230.3, 78.37));
    const volAspect = ethanol.getAspect<VolatilityAspect>(VolatilityAspect.TYPE);

    const p20 = volAspect?.getVaporPressureMmHg(20);
    const p78 = volAspect?.getVaporPressureMmHg(78.37);

    console.log(`[DOMAIN ETHANOL VAPOR]: 20°C = ${p20?.toFixed(1)} mmHg, 78.37°C (кипение) = ${p78?.toFixed(1)} mmHg (~760 mmHg)`);
    expect(p20).toBeCloseTo(44, 0);
    expect(p78).toBeGreaterThan(755);
    expect(p78).toBeLessThan(765);
  });
});
