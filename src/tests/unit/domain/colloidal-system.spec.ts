import { describe, it, expect } from 'vitest';
import { ChemicalSpecies } from '@domain/entities/chemical-species';
import { DomainPhase } from '@domain/entities/domain-phase';
import { DomainPhaseBoundary } from '@domain/entities/domain-phase-boundary';
import { ColloidalSystem } from '@domain/entities/colloidal-system';
import { SurfaceActiveAspect } from '@domain/aspects/surface-active.aspect';
import { DropletSpectrum } from '@domain/values/droplet-spectrum';

describe('Domain ColloidalSystem Aggregate (Фазы, границы раздела и морфология)', () => {
  const water = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0);
  const jojobaOil = new ChemicalSpecies('jojoba', 'Масло Жожоба', 'Simmondsia Chinensis Seed Oil', 860.0, 0.865);
  const tween80 = new ChemicalSpecies('tween_80', 'Твин-80', 'Polysorbate 80', 1310.0, 1.08)
    .withAspect(new SurfaceActiveAspect('nonionic', 0.00001, -2.0, 15.0));

  it('должен формировать агрегат эмульсии O/W с корректными массами и межфазным натяжением', () => {
    const waterPhase = new DomainPhase('phase_w', 'Водная фаза (А)');
    waterPhase.addComponent(water, 80.0);

    const oilPhase = new DomainPhase('phase_o', 'Масляная фаза (Б)');
    oilPhase.addComponent(jojobaOil, 20.0);

    const boundary = new DomainPhaseBoundary(waterPhase, oilPhase, 45.0);
    boundary.adsorbSurfactant(tween80, 0.005); // 0.005 моль ПАВ на границе раздела

    const system = new ColloidalSystem([waterPhase, oilPhase], [boundary]);
    system.setDropletSpectrum(new DropletSpectrum(0.5, 2.5, 3.0, 5.2));

    const totalMass = system.getTotalMassGrams();
    const ift = boundary.getInterfacialTension();
    const morphology = system.getMorphology();
    const hld = system.calculateHLD();

    console.log(`\n┌─ [DOMAIN COLLOIDAL SYSTEM] Крем-эмульсия ────────────────────────`);
    console.log(`│ Общая масса:  ${totalMass.toFixed(1)} г (Вода: 80г, Масло: 20г)`);
    console.log(`│ Морфология:   ${morphology} (Прямая эмульсия масло-в-воде)`);
    console.log(`│ HLD Баланс:   ${hld.toFixed(2)} (Режим стабильной O/W эмульсии)`);
    console.log(`│ Межфазное:    ${ift.toFixed(2)} мН/м (Снижено адсорбцией ПАВ)`);
    console.log(`│ Капли d32:    ${system.getDropletSpectrum().d32Microns} µm (Span: ${system.getDropletSpectrum().polydispersitySpan.toFixed(2)})`);
    console.log(`└──────────────────────────────────────────────────────────────────`);

    expect(totalMass).toBe(100.0);
    expect(morphology).toBe('O/W');
    expect(ift).toBeLessThan(45.0);
    expect(hld).toBeLessThan(0);
    expect(system.getDropletSpectrum().isCoarseEmulsion).toBe(false);
  });
});
