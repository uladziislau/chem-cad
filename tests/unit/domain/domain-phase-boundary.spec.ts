import { describe, it, expect } from 'vitest';
import { DomainPhase } from '@domain/entities/domain-phase';
import { DomainPhaseBoundary } from '@domain/entities/domain-phase-boundary';
import { ChemicalSpecies } from '@domain/entities/chemical-species';
import { SurfaceActiveAspect } from '@domain/aspects/surface-active.aspect';

describe('DomainPhaseBoundary', () => {
  const water = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0);
  const oil = new ChemicalSpecies('oil', 'Масло', 'Paraffinum', 300.0, 0.85);
  const sls = new ChemicalSpecies('sls', 'SLS', 'SLS', 288.38, 1.0, undefined, [
    new SurfaceActiveAspect('anionic', 0.008, 0.0, 10.0, 3.5e-6)
  ]);
  const cocoGlucoside = new ChemicalSpecies('coco', 'Коко-глюкозид', 'Coco', 300.0, 1.0, undefined, [
    new SurfaceActiveAspect('nonionic', 0.1, 0.0, 13.0, 2.0e-6)
  ]);

  function createPhases() {
    const waterPhase = new DomainPhase('water', 'Water Phase');
    waterPhase.addComponent(water, 500); // 500 ml
    const oilPhase = new DomainPhase('oil', 'Oil Phase');
    oilPhase.addComponent(oil, 425); // 500 ml
    return { waterPhase, oilPhase };
  }

  it('должен возвращать базовое натяжение без ПАВ', () => {
    const { waterPhase, oilPhase } = createPhases();
    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 50.0);
    expect(boundary.getInterfacialTension()).toBe(50.0);
  });

  it('должен адсорбировать ПАВ и накапливать моли', () => {
    const { waterPhase, oilPhase } = createPhases();
    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 50.0);
    boundary.adsorbSurfactant(sls, 0.1);
    boundary.adsorbSurfactant(sls, 0.05);

    const adsorbed = boundary.getAdsorbedSurfactants();
    expect(adsorbed).toHaveLength(1);
    expect(adsorbed[0].moles).toBeCloseTo(0.15, 5);
  });

  it('должен снижать натяжение при адсорбции ПАВ', () => {
    const { waterPhase, oilPhase } = createPhases();
    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 50.0);
    boundary.adsorbSurfactant(sls, 0.5); // высокая концентрация

    const tension = boundary.getInterfacialTension();
    expect(tension).toBeLessThan(50.0);
    expect(tension).toBeGreaterThan(0.1);
  });

  it('должен игнорировать неположительные моли', () => {
    const { waterPhase, oilPhase } = createPhases();
    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 50.0);
    boundary.adsorbSurfactant(sls, 0);
    boundary.adsorbSurfactant(sls, -1);

    expect(boundary.getAdsorbedSurfactants()).toHaveLength(0);
    expect(boundary.getInterfacialTension()).toBe(50.0);
  });

  it('должен обрабатывать несколько типов ПАВ', () => {
    const { waterPhase, oilPhase } = createPhases();
    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 50.0);
    boundary.adsorbSurfactant(sls, 0.2);
    boundary.adsorbSurfactant(cocoGlucoside, 0.3);

    const adsorbed = boundary.getAdsorbedSurfactants();
    expect(adsorbed).toHaveLength(2);

    const tension = boundary.getInterfacialTension();
    expect(tension).toBeLessThan(50.0);
  });

  it('должен игнорировать ПАВ без SurfaceActiveAspect', () => {
    const plain = new ChemicalSpecies('plain', 'Обычный', 'Plain', 100, 1.0);
    const { waterPhase, oilPhase } = createPhases();
    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 50.0);
    boundary.adsorbSurfactant(plain, 1.0);

    expect(boundary.getInterfacialTension()).toBe(50.0);
  });
});
