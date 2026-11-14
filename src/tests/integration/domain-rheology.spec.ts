import { describe, it, expect } from 'vitest';
import { ChemicalSpecies } from '../../core/domain/entities/chemical-species';
import { DomainPhase } from '../../core/domain/entities/domain-phase';
import { ColloidalSystem } from '../../core/domain/entities/colloidal-system';
import { PolymericNetworkAspect } from '../../core/domain/aspects/polymeric-network.aspect';
import { NonNewtonianRheologyService } from '../../core/domain/services/non-newtonian-rheology.service';

describe('Domain NonNewtonianRheologyService (Неньютоновская реология и разворачивание гелей)', () => {
  const water = new ChemicalSpecies('water', 'Вода', 'Aqua', 18.015, 1.0);
  
  // Карбомер (сшитая полиакриловая кислота)
  const carbomer = new ChemicalSpecies('carbomer', 'Карбомер 940', 'Carbomer', 500000.0, 1.4)
    .withAspect(new PolymericNetworkAspect(
      4.75, // pKa карбоксильных групп
      15.0, // базовая [η]0
      50.0, // расширение до 50 раз
      0.04  // критическая соленость для экранирования
    ));

  it('должен моделировать скачок вязкости и предела текучести при нейтрализации карбомера (pH 3.0 -> 6.0)', () => {
    const gelPhase = new DomainPhase('gel_phase', 'Карбомерный гель');
    gelPhase.addComponent(water, 995.0);
    gelPhase.addComponent(carbomer, 5.0); // 0.5% карбомера

    const system = new ColloidalSystem([gelPhase]);

    // 1. До нейтрализации (кислая среда pH 3.0, клубки свернуты)
    const acidProfile = NonNewtonianRheologyService.calculateSystemProfile(system, { ph: 3.0 });

    // 2. После нейтрализации щелочью (pH 6.0, клубки развернуты в 3D сетку)
    const neutralProfile = NonNewtonianRheologyService.calculateSystemProfile(system, { ph: 6.0 });

    console.log(`\n┌─ [GEL ACTIVATION] Нейтрализация Карбомера 0.5% (pH 3.0 ➔ 6.0) ──────────`);
    console.log(`│ pH 3.0: Предел текучести = ${acidProfile.yieldStressPa.toFixed(2)} Па, Вязкость @ 10 с^-1 = ${acidProfile.getApparentViscosityCp(10).toFixed(0)} сП`);
    console.log(`│ pH 6.0: Предел текучести = ${neutralProfile.yieldStressPa.toFixed(2)} Па, Вязкость @ 10 с^-1 = ${neutralProfile.getApparentViscosityCp(10).toFixed(0)} сП [ГЕЛЬ СФОРМИРОВАН]`);
    console.log(`└─────────────────────────────────────────────────────────────────────────`);

    expect(neutralProfile.yieldStressPa).toBeGreaterThan(acidProfile.yieldStressPa);
    expect(neutralProfile.hasYieldStress).toBe(true);
    expect(neutralProfile.isShearThinning).toBe(true);
    expect(neutralProfile.getApparentViscosityCp(10)).toBeGreaterThan(acidProfile.getApparentViscosityCp(10) * 10);
  });

  it('должен моделировать сдвиговое разжижение (Shear Thinning) при нанесении на кожу', () => {
    const gelPhase = new DomainPhase('gel_phase', 'Готовый гель');
    gelPhase.addComponent(water, 995.0);
    gelPhase.addComponent(carbomer, 5.0);

    const system = new ColloidalSystem([gelPhase]);
    const profile = NonNewtonianRheologyService.calculateSystemProfile(system, { ph: 6.0 });

    const shearRates = [0.1, 1.0, 10.0, 100.0, 1000.0];
    const labels = [
      'Покой в баночке (0.1 с^-1)',
      'Наклон баночки  (1.0 с^-1)',
      'Выдавливание   (10.0 с^-1)',
      'Медленный сдвиг (100 с^-1)',
      'Растирание кожи(1000 с^-1)'
    ];

    console.log(`\n┌─ [FLOW CURVE] Сдвиговое разжижение геля (Кривая Гершеля-Балкли) ─────────`);
    for (let i = 0; i < shearRates.length; i++) {
      const rate = shearRates[i];
      const visc = profile.getApparentViscosityCp(rate);
      const bar = '▓'.repeat(Math.min(30, Math.max(1, Math.round(Math.log10(visc) * 6))));
      console.log(`│ ${labels[i].padEnd(25)} ➔ ${visc.toFixed(0).padStart(7)} сП  [${bar}]`);
    }
    console.log(`└─────────────────────────────────────────────────────────────────────────`);

    const viscRest = profile.getApparentViscosityCp(0.1);
    const viscSkin = profile.getApparentViscosityCp(1000.0);

    // При растирании по коже вязкость должна снижаться минимум на порядок
    expect(viscSkin).toBeLessThan(viscRest / 10.0);
  });

  it('должен моделировать схлопывание структуры геля при добавлении соли (NaCl)', () => {
    const gelPhase = new DomainPhase('gel_phase', 'Гель');
    gelPhase.addComponent(water, 995.0);
    gelPhase.addComponent(carbomer, 5.0);

    const system = new ColloidalSystem([gelPhase]);

    // Без соли (деионизированная вода, I = 0.001 M)
    const pureProfile = NonNewtonianRheologyService.calculateSystemProfile(system, { ph: 6.0, ionicStrengthM: 0.001 });

    // С добавлением 1% NaCl (I ≈ 0.17 M — сильное экранирование зарядов цепи)
    const saltedProfile = NonNewtonianRheologyService.calculateSystemProfile(system, { ph: 6.0, ionicStrengthM: 0.17 });

    console.log(`\n┌─ [SALT SENSITIVITY] Деградация структуры карбомера солью (NaCl 1%) ─────`);
    console.log(`│ Без соли (I=0.001M): Предел текучести = ${pureProfile.yieldStressPa.toFixed(2)} Па`);
    console.log(`│ С солью  (I=0.170M): Предел текучести = ${saltedProfile.yieldStressPa.toFixed(2)} Па [Схлопывание сетки]`);
    console.log(`└─────────────────────────────────────────────────────────────────────────`);

    expect(saltedProfile.yieldStressPa).toBeLessThan(pureProfile.yieldStressPa);
  });
});
