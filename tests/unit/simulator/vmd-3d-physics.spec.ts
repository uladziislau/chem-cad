import { describe, it, expect } from 'vitest';
import { computeRepulsion, applySprings, integrateParticles } from '@root-modules/simulator/vmd-3d.physics';

describe('VMD-3D Physics (Минимизация энергии)', () => {
  describe('computeRepulsion', () => {
    it('пустой массив — нет сил', () => {
      const positions = new Float32Array(0);
      const forces = new Float32Array(0);
      computeRepulsion(positions, forces, 0, 100);
      expect(forces.length).toBe(0);
    });
    it('два атома далеко — слабое отталкивание', () => {
      // Два атома на расстоянии 9 единиц (rSq = 81 < 100)
      const positions = new Float32Array([
        0, 0, 0,
        9, 0, 0
      ]);
      const forces = new Float32Array(6);
      computeRepulsion(positions, forces, 2, 100);

      // Сила должна быть направлена от j к i (отталкивание)
      expect(forces[0]).toBeLessThan(0); // fx отрицательный (i отталкивается влево)
      expect(forces[3]).toBeGreaterThan(0); // fx положительный (j отталкивается вправо)
    });

    it('два атома близко — сильное отталкивание', () => {
      const positions = new Float32Array([
        0, 0, 0,
        2, 0, 0
      ]);
      const forcesNear = new Float32Array(6);
      const forcesFar = new Float32Array(6);

      computeRepulsion(positions, forcesNear, 2, 100);

      const positionsFar = new Float32Array([
        0, 0, 0,
        9, 0, 0 // rSq = 81 < 100, в пределах cutoff
      ]);
      computeRepulsion(positionsFar, forcesFar, 2, 100);

      // Близкие атомы должны иметь большую силу
      const magNear = Math.abs(forcesNear[0]);
      const magFar = Math.abs(forcesFar[0]);
      expect(magNear).toBeGreaterThan(magFar);
    });

    it('атомы за пределами cutoff (rSq > 100) — нет взаимодействия', () => {
      const positions = new Float32Array([
        0, 0, 0,
        15, 0, 0 // rSq = 225 > 100
      ]);
      const forces = new Float32Array(6);
      computeRepulsion(positions, forces, 2, 100);

      expect(forces[0]).toBe(0);
      expect(forces[3]).toBe(0);
    });

    it('атомы слишком близко (rSq < 0.1) — нет взаимодействия (защита от деления на ноль)', () => {
      const positions = new Float32Array([
        0, 0, 0,
        0.2, 0, 0 // rSq = 0.04 < 0.1
      ]);
      const forces = new Float32Array(6);
      computeRepulsion(positions, forces, 2, 100);

      expect(forces[0]).toBe(0);
      expect(forces[3]).toBe(0);
    });

    it('три атома — силы суммируются корректно', () => {
      const positions = new Float32Array([
        0, 0, 0,
        5, 0, 0,
        10, 0, 0
      ]);
      const forces = new Float32Array(9);
      computeRepulsion(positions, forces, 3, 100);

      // Атом 0 отталкивается от 1 и 2 (влево)
      expect(forces[0]).toBeLessThan(0);
      // Атом 2 отталкивается от 0 и 1 (вправо)
      expect(forces[6]).toBeGreaterThan(0);
      // Атом 1: отталкивается от 0 (влево) и от 2 (вправо) — частично компенсируется
      // Но ближе к 0 (r=5), чем к 2 (r=5) — симметрично, но не точно из-за cutoff
    });
  });

  describe('applySprings', () => {
    it('пустые связи — нет сил', () => {
      const positions = new Float32Array(6);
      const forces = new Float32Array(6);
      applySprings(positions, forces, [], 200, 2.5);
      expect(forces[0]).toBe(0);
      expect(forces[3]).toBe(0);
    });

    it('связь растянута — пружина тянет атомы вместе', () => {
      // Атомы на расстоянии 5, restLength = 2.5 → растянута
      const positions = new Float32Array([
        0, 0, 0,
        5, 0, 0
      ]);
      const forces = new Float32Array(6);
      applySprings(positions, forces, [0, 1], 200, 2.5);

      // Сила должна тянуть i вправо (+x) и j влево (-x)
      expect(forces[0]).toBeGreaterThan(0);
      expect(forces[3]).toBeLessThan(0);
    });

    it('связь сжата — пружина толкает атомы врозь', () => {
      // Атомы на расстоянии 1, restLength = 2.5 → сжата
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0
      ]);
      const forces = new Float32Array(6);
      applySprings(positions, forces, [0, 1], 200, 2.5);

      // Сила должна толкать i влево (-x) и j вправо (+x)
      expect(forces[0]).toBeLessThan(0);
      expect(forces[3]).toBeGreaterThan(0);
    });

    it('связь в равновесии (r = restLength) — нет силы', () => {
      const positions = new Float32Array([
        0, 0, 0,
        2.5, 0, 0
      ]);
      const forces = new Float32Array(6);
      applySprings(positions, forces, [0, 1], 200, 2.5);

      expect(forces[0]).toBeCloseTo(0, 5);
      expect(forces[3]).toBeCloseTo(0, 5);
    });

    it('несколько связей — силы суммируются', () => {
      // Три атома в цепочке: 0-1-2
      // atom0=(0,0,0), atom1=(5,0,0), atom2=(10,0,0)
      // Связь 0-1: r=5, rest=2.5 → force на atom0 = +500, на atom1 = -500
      // Связь 1-2: r=5, rest=2.5 → force на atom1 = +500, на atom2 = -500
      // Итог atom1: -500 + 500 = 0 (компенсация, симметричная цепочка)
      const positions = new Float32Array([
        0, 0, 0,
        5, 0, 0,
        10, 0, 0
      ]);
      const forces = new Float32Array(9);
      applySprings(positions, forces, [0, 1, 1, 2], 200, 2.5);

      // Атом 0: только связь 0-1, тянет вправо (+x)
      expect(forces[0]).toBeGreaterThan(0);
      // Атом 2: только связь 1-2, тянет влево (-x)
      expect(forces[6]).toBeLessThan(0);
      // Атом 1: симметричные связи компенсируются → ~0
      expect(Math.abs(forces[3])).toBeLessThan(1e-6);
    });
  });

  describe('Интеграция: repulsion + springs + integrate', () => {
    it('молекула из двух атомов — связь удерживает, repulsion раздвигает', () => {
      // Два атома близко, связь между ними
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0 // r = 1, restLength = 2.5 → сжата, пружина толкает
      ]);
      const velocities = new Float32Array(6);
      const forces = new Float32Array(6);
      const bondPairs = [0, 1];
      const boxSize = 40;
      const dt = 0.016;

      // Шаг 1: repulsion + springs
      forces.fill(0);
      computeRepulsion(positions, forces, 2, 50);
      applySprings(positions, forces, bondPairs, 200, 2.5);
      integrateParticles(positions, velocities, forces, 2, dt, true, boxSize, 0.85);

      // После шага позиции должны измениться
      expect(positions[0]).not.toBe(0);
      expect(positions[3]).not.toBe(1);

      // Несколько шагов — система должна стабилизироваться около restLength
      for (let i = 0; i < 100; i++) {
        forces.fill(0);
        computeRepulsion(positions, forces, 2, 50);
        applySprings(positions, forces, bondPairs, 200, 2.5);
        integrateParticles(positions, velocities, forces, 2, dt, true, boxSize, 0.85);
      }

      // Расстояние между атомами должно быть ближе к restLength
      const dx = positions[3] - positions[0];
      const dy = positions[4] - positions[1];
      const dz = positions[5] - positions[2];
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Не точное равенство (repulsion тоже действует), но должно быть в разумных пределах
      expect(r).toBeGreaterThan(1.0);
      expect(r).toBeLessThan(5.0);
    });
  });
});
