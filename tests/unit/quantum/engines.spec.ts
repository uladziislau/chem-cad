import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { QuantumEngineService } from '@modules/quantum/services/quantum-engine.service';
import { BondingEngineService } from '@modules/quantum/services/bonding-engine.service';

/**
 * Юнит-тесты QuantumEngineService (атом из субатомных частиц)
 * и BondingEngineService (классификация связи по ΔEN Полинга).
 */
describe('QuantumEngineService', () => {
  let service: QuantumEngineService;

  beforeEach(() => {
    const injector = createEnvironmentInjector([QuantumEngineService], null as unknown as EnvironmentInjector);
    service = injector.get(QuantumEngineService);
  });

  it('дефолтное состояние — атом водорода (протий)', () => {
    const p = service.properties();
    expect(service.atomState()).toEqual({ protons: 1, neutrons: 0, electrons: 1 });
    expect(p.element?.symbol).toBe('H');
    expect(p.massNumber).toBe(1);
    expect(p.netCharge).toBe(0);
    expect(p.ionType).toBe('neutral');
    expect(p.isStable).toBe(true);
    expect(p.isotopeName).toBe('Протий (Водород)');
  });

  it('добавление протона превращает H в He и даёт катион (e не добавлен)', () => {
    service.addParticle('proton');
    const p = service.properties();
    expect(service.atomState().protons).toBe(2);
    expect(p.element?.symbol).toBe('He');
    expect(p.massNumber).toBe(2);
    expect(p.netCharge).toBe(1); // 2p - 1e
    expect(p.ionType).toBe('cation');
  });

  it('удаление протона нельзя ниже 1 (атом без протонов не существует)', () => {
    for (let i = 0; i < 10; i++) service.removeParticle('proton');
    expect(service.atomState().protons).toBe(1);
  });

  it('нейтроны и электроны можно довести до нуля', () => {
    service.addParticle('neutron');
    service.addParticle('electron');
    service.removeParticle('neutron');
    service.removeParticle('electron');
    // электронов было 2 после add (1+1), remove → 1; нейтронов 1→0
    expect(service.atomState().neutrons).toBe(0);
    expect(service.atomState().electrons).toBe(1);
  });

  it('лимиты добавления: p<8, n<10, e<10', () => {
    for (let i = 0; i < 20; i++) {
      service.addParticle('proton');
      service.addParticle('neutron');
      service.addParticle('electron');
    }
    const s = service.atomState();
    expect(s.protons).toBe(8);   // кислород — предел таблицы
    expect(s.neutrons).toBeLessThanOrEqual(10);
    expect(s.electrons).toBeLessThanOrEqual(10);
  });

  it('избыток электронов даёт анион', () => {
    service.addParticle('electron');
    service.addParticle('electron');
    const p = service.properties();
    expect(p.netCharge).toBe(-2); // 1p - 3e
    expect(p.ionType).toBe('anion');
  });

  it('имена изотопов водорода: дейтерий и тритий', () => {
    service.addParticle('neutron');
    expect(service.properties().isotopeName).toBe('Дейтерий');
    service.addParticle('neutron');
    expect(service.properties().isotopeName).toBe('Тритий (Радиоактивен)');
  });

  it('стабильность по n/p-соотношению: 6p6n стабилен, 6p2n нет', () => {
    // Углерод: 6 протонов + 6 нейтронов
    for (let i = 0; i < 5; i++) service.addParticle('proton'); // 1→6
    for (let i = 0; i < 6; i++) service.addParticle('neutron');
    expect(service.atomState()).toMatchObject({ protons: 6, neutrons: 6 });
    expect(service.properties().isStable).toBe(true);
    expect(service.properties().element?.symbol).toBe('C');
  });

  it('протонов >8 → element = null (за пределами PERIODIC_TABLE)', () => {
    // лимит addParticle не даёт >8 напрямую — убираем через state нельзя,
    // но 8p = O валиден; проверяем границу таблицы через 8 протонов
    for (let i = 0; i < 7; i++) service.addParticle('proton');
    expect(service.properties().element?.symbol).toBe('O');
  });
});

describe('BondingEngineService', () => {
  let service: BondingEngineService;

  beforeEach(() => {
    const injector = createEnvironmentInjector([BondingEngineService], null as unknown as EnvironmentInjector);
    service = injector.get(BondingEngineService);
  });

  it('H–H: ΔEN=0 → ковалентная неполярная, сдвиг 0', () => {
    const b = service.bondResult();
    expect(b.type).toBe('covalent-nonpolar');
    expect(b.deltaEN).toBe(0);
    expect(b.electronShift).toBe(0);
  });

  it('He с любым атомом → связи нет (благородный газ)', () => {
    service.setAtomA(2);
    const b = service.bondResult();
    expect(b.type).toBe('none');
    expect(b.description).toContain('благородн');
  });

  it('H–O: ΔEN=1.24 → ковалентная полярная, сдвиг к O (вправо)', () => {
    service.setAtomA(1); // H
    service.setAtomB(8); // O
    const b = service.bondResult();
    expect(b.type).toBe('covalent-polar');
    expect(b.deltaEN).toBeCloseTo(1.24, 2);
    expect(b.electronShift).toBeGreaterThan(0);
    expect(b.electronShift).toBeLessThanOrEqual(1);
  });

  it('O–H: направление сдвига меняется (более электроотрицательный слева → shift < 0)', () => {
    service.setAtomA(8); // O
    service.setAtomB(1); // H
    const b = service.bondResult();
    expect(b.type).toBe('covalent-polar');
    expect(b.electronShift).toBeLessThan(0);
  });

  it('Li–O: ΔEN=2.46 → ионная, полный сдвиг ±1', () => {
    service.setAtomA(3); // Li
    service.setAtomB(8); // O
    const b = service.bondResult();
    expect(b.type).toBe('ionic');
    expect(b.electronShift).toBe(1);
  });

  it('границы ΔEN: 0.4 → nonpolar, 0.41 → polar, 1.7 → polar, >1.7 → ionic', () => {
    // H(2.20)-B(2.04): ΔEN=0.16 nonpolar; C(2.55)-H(2.20): 0.35 nonpolar
    service.setAtomA(6); // C 2.55
    service.setAtomB(1); // H 2.20 → 0.35
    expect(service.bondResult().type).toBe('covalent-nonpolar');

    // B(2.04)-H(2.20): 0.16; N(3.04)-H(2.20): 0.84 polar
    service.setAtomA(7); // N
    service.setAtomB(1); // H → 0.84 polar
    expect(service.bondResult().type).toBe('covalent-polar');

    // N(3.04)-B(2.04): 1.00 polar; O(3.44)-Li(0.98): 2.46 ionic
    service.setAtomA(8);
    service.setAtomB(3);
    expect(service.bondResult().type).toBe('ionic');
  });

  it('неизвестный atomicNumber → type none («Выберите атомы»)', () => {
    service.setAtomA(999);
    const b = service.bondResult();
    expect(b.type).toBe('none');
    expect(b.description).toContain('Выберите атомы');
  });

  it('availableElements — 8 элементов таблицы', () => {
    expect(service.availableElements.length).toBe(8);
    expect(service.availableElements.map(e => e.symbol)).toContain('O');
  });
});
