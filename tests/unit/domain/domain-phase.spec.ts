import { describe, it, expect } from 'vitest';
import { DomainPhase } from '@domain/entities/domain-phase';
import { DomainPhaseBoundary } from '@domain/entities/domain-phase-boundary';
import { ChemicalSpecies } from '@domain/entities/chemical-species';
import { HansenSolubilityAspect } from '@domain/aspects/hansen-solubility.aspect';
import { SurfaceActiveAspect } from '@domain/aspects/surface-active.aspect';
import { HansenVector } from '@domain/values/hansen-vector';

describe('DomainPhase', () => {
  const water = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0);
  const ethanol = new ChemicalSpecies('ethanol', 'Этанол', 'Ethanol', 46.07, 0.789);
  const oil = new ChemicalSpecies('oil', 'Масло', 'Paraffinum', 300.0, 0.85);

  it('должен добавлять компоненты и накапливать массу', () => {
    const phase = new DomainPhase('p1', 'Water Phase');
    phase.addComponent(water, 50);
    phase.addComponent(water, 30);
    phase.addComponent(ethanol, 20);

    expect(phase.getTotalMassGrams()).toBe(100);
    expect(phase.getAllComponents()).toHaveLength(2);
    expect(phase.getComponent('water')?.massGrams).toBe(80);
  });

  it('должен игнорировать неположительную массу', () => {
    const phase = new DomainPhase('p1', 'Test');
    phase.addComponent(water, 0);
    phase.addComponent(water, -5);
    phase.addComponent(water, 10);

    expect(phase.getTotalMassGrams()).toBe(10);
  });

  it('должен возвращать null для пустой фазы Hansen', () => {
    const phase = new DomainPhase('p1', 'Empty');
    expect(phase.getAverageHansenVector()).toBeNull();
  });

  it('должен рассчитывать общий объем и плотность', () => {
    const phase = new DomainPhase('p1', 'Mix');
    phase.addComponent(water, 100); // 100 ml
    phase.addComponent(oil, 85);    // 100 ml

    expect(phase.getTotalVolumeMl()).toBeCloseTo(200, 1);
    expect(phase.getDensityGPerMl()).toBeCloseTo(0.925, 2);
  });

  it('должен рассчитывать общие моли', () => {
    const phase = new DomainPhase('p1', 'Mix');
    phase.addComponent(water, 18.015); // 1 моль
    phase.addComponent(ethanol, 46.07); // 1 моль

    expect(phase.getTotalMoles()).toBeCloseTo(2.0, 5);
  });

  it('должен вычислять средний Hansen-вектор по массе', () => {
    const waterHansen = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0, undefined, [
      new HansenSolubilityAspect(new HansenVector(15.5, 16.0, 42.3))
    ]);
    const ethanolHansen = new ChemicalSpecies('ethanol', 'Этанол', 'Ethanol', 46.07, 0.789, undefined, [
      new HansenSolubilityAspect(new HansenVector(15.8, 8.8, 19.4))
    ]);

    const phase = new DomainPhase('p1', 'Mix');
    phase.addComponent(waterHansen, 50);
    phase.addComponent(ethanolHansen, 50);

    const avg = phase.getAverageHansenVector();
    expect(avg).not.toBeNull();
    expect(avg!.dispersionD).toBeCloseTo((15.5 + 15.8) / 2, 1);
    expect(avg!.polarP).toBeCloseTo((16.0 + 8.8) / 2, 1);
    expect(avg!.hydrogenH).toBeCloseTo((42.3 + 19.4) / 2, 1);
  });

  it('должен игнорировать компоненты без Hansen-аспекта в среднем', () => {
    const waterHansen = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0, undefined, [
      new HansenSolubilityAspect(new HansenVector(15.5, 16.0, 42.3))
    ]);
    const plain = new ChemicalSpecies('plain', 'Обычный', 'Plain', 100, 1.0);

    const phase = new DomainPhase('p1', 'Mix');
    phase.addComponent(waterHansen, 50);
    phase.addComponent(plain, 50);

    const avg = phase.getAverageHansenVector();
    expect(avg).not.toBeNull();
    expect(avg!.dispersionD).toBeCloseTo(15.5, 1);
  });
});
