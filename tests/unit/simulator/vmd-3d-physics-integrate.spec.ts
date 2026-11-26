import { describe, it, expect } from 'vitest';
import { integrateParticles } from '@root-modules/simulator/vmd-3d.physics';

describe('integrateParticles', () => {
  it('пустой массив — возвращает 0', () => {
    const ke = integrateParticles(
      new Float32Array(0), new Float32Array(0), new Float32Array(0),
      0, 0.016, false, 40, 0.99
    );
    expect(ke).toBe(0);
  });

  it('один атом без сил — движется по инерции, отражается от стен', () => {
    const positions = new Float32Array([5, 5, 5]);
    const velocities = new Float32Array([1, 0, 0]); // скорость +x
    const forces = new Float32Array(3); // нет сил
    const boxSize = 10;

    // Несколько шагов — должен двигаться и отразиться
    for (let i = 0; i < 20; i++) {
      integrateParticles(positions, velocities, forces, 1, 0.1, false, boxSize, 1.0);
    }

    // Позиция должна быть внутри коробки
    expect(positions[0]).toBeGreaterThanOrEqual(1.0);
    expect(positions[0]).toBeLessThanOrEqual(boxSize - 1.0);
  });

  it('сила двигает атом — скорость и позиция меняются', () => {
    const positions = new Float32Array([5, 5, 5]);
    const velocities = new Float32Array([0, 0, 0]);
    const forces = new Float32Array([10, 0, 0]); // сила +x
    const boxSize = 40;

    integrateParticles(positions, velocities, forces, 1, 0.1, false, boxSize, 1.0);

    // Скорость должна увеличиться в +x
    expect(velocities[0]).toBeGreaterThan(0);
    // Позиция должна сдвинуться в +x
    expect(positions[0]).toBeGreaterThan(5);
  });

  it('friction замедляет частицы', () => {
    const positions1 = new Float32Array([5, 5, 5]);
    const velocities1 = new Float32Array([10, 0, 0]);
    const forces1 = new Float32Array(3);

    const positions2 = new Float32Array([5, 5, 5]);
    const velocities2 = new Float32Array([10, 0, 0]);
    const forces2 = new Float32Array(3);

    // С friction = 1.0 (без потерь)
    integrateParticles(positions1, velocities1, forces1, 1, 0.1, false, 40, 1.0);
    // С friction = 0.5 (с потерями)
    integrateParticles(positions2, velocities2, forces2, 1, 0.1, false, 40, 0.5);

    expect(Math.abs(velocities2[0])).toBeLessThan(Math.abs(velocities1[0]));
  });

  it('isMolecule=true — добавляется центростремительная сила к центру', () => {
    const positions = new Float32Array([35, 35, 35]); // далеко от центра (20,20,20)
    const velocities = new Float32Array([0, 0, 0]);
    const forces = new Float32Array(3);
    const boxSize = 40;

    integrateParticles(positions, velocities, forces, 1, 0.1, true, boxSize, 1.0);

    // Сила должна тянуть к центру (-x, -y, -z)
    // integrateParticles добавляет (center - pos) * 1.0 к forces
    // center = 20, pos = 35 → force += (20-35) = -15
    expect(velocities[0]).toBeLessThan(0);
    expect(velocities[1]).toBeLessThan(0);
    expect(velocities[2]).toBeLessThan(0);
  });

  it('возвращает кинетическую энергию', () => {
    const positions = new Float32Array([5, 5, 5]);
    const velocities = new Float32Array([2, 0, 0]); // v² = 4
    const forces = new Float32Array(3);

    const ke = integrateParticles(positions, velocities, forces, 1, 0.1, false, 40, 1.0);

    // KE = 0.5 * m * v² = 0.5 * 1 * (2² + 0 + 0) = 2.0
    // Но после обновления velocity изменится из-за forces (нет сил → без изменений)
    // и positions обновится
    expect(ke).toBeGreaterThan(0);
  });

  it('отражение от стен сохраняет энергию (упрощённо)', () => {
    const positions = new Float32Array([9.5, 5, 5]); // близко к стене x=10
    const velocities = new Float32Array([5, 0, 0]); // летит в стену
    const forces = new Float32Array(3);
    const boxSize = 10;

    integrateParticles(positions, velocities, forces, 1, 0.1, false, boxSize, 1.0);

    // Должен отразиться: x не должен быть > boxSize - r
    expect(positions[0]).toBeLessThanOrEqual(boxSize - 1.0);
    // Скорость должна инвертироваться
    expect(velocities[0]).toBeLessThan(0);
  });
});

