import { describe, it, expect } from 'vitest';
import { MiscibilitySolver } from '@root-modules/solvers/miscibility-solver';
import { HansenParameters } from '@root-modules/thermodynamics/hansen-parameters';

describe('MiscibilitySolver (Смешиваемость по Хансену)', () => {
  it('одинаковые параметры → полная смешиваемость', () => {
    const a = new HansenParameters(15, 5, 10);
    const b = new HansenParameters(15, 5, 10);
    const r = MiscibilitySolver.calculateMiscibility(a, b);
    expect(r.distanceRa).toBe(0);
    expect(r.redScore).toBe(0);
    expect(r.isMiscible).toBe(true);
    expect(r.message).toContain('Идеальная');
  });

  it('далёкие параметры → расслоение', () => {
    const water = new HansenParameters(15.6, 16.0, 42.3);
    const oil = new HansenParameters(16.0, 3.0, 4.0);
    const r = MiscibilitySolver.calculateMiscibility(water, oil);
    expect(r.distanceRa).toBeGreaterThan(8);
    expect(r.redScore).toBeGreaterThan(1);
    expect(r.isMiscible).toBe(false);
    expect(r.message).toContain('расслоение');
  });

  it('граничный случай RED ≈ 1 → частичная смешиваемость', () => {
    // Ra ≈ R0 (8.0) → RED ≈ 1
    const a = new HansenParameters(10, 0, 0);
    const b = new HansenParameters(10, 8, 0); // Ra = 8
    const r = MiscibilitySolver.calculateMiscibility(a, b, 8.0);
    expect(r.redScore).toBeCloseTo(1.0, 5);
    expect(r.isMiscible).toBe(true);
  });

  it('кастомный R0 влияет на результат', () => {
    const a = new HansenParameters(10, 0, 0);
    const b = new HansenParameters(10, 8, 0);
    const strict = MiscibilitySolver.calculateMiscibility(a, b, 4.0);
    const loose = MiscibilitySolver.calculateMiscibility(a, b, 16.0);
    expect(strict.isMiscible).toBe(false);
    expect(loose.isMiscible).toBe(true);
  });
});
