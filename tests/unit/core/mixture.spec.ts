import { describe, it, expect } from 'vitest';
import { Mixture } from '@domain/entities/mixture';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Mass, Moles, Volume } from '@root-modules/units/quantities';

// Тестовые вещества
const water = new PureSubstance('Water', 18.015, 8.07, 1730, 233, 1.0, 0);
const ethanol = new PureSubstance('Ethanol', 46.07, 8.20, 1642, 230, 0.789, -114);
const glycerin = new PureSubstance('Glycerin', 92.09, 6.50, 1200, 200, 1.26, 18);

describe('Mixture (Смесь веществ)', () => {
  describe('addComponent', () => {
    it('добавляет компонент по массе', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Mass(18.015, 'g'));
      expect(mix.getComponents()).toHaveLength(1);
      expect(mix.getComponents()[0].moles).toBeCloseTo(1.0, 5);
    });

    it('добавляет компонент по молям', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(2.0, 'mol'));
      expect(mix.getComponents()[0].moles).toBeCloseTo(2.0, 5);
    });

    it('добавляет компонент по объёму', () => {
      const mix = new Mixture();
      // 18 мл воды * 1.0 г/мл = 18 г = 1 моль
      mix.addComponent(water, new Volume(18, 'ml'));
      expect(mix.getComponents()[0].moles).toBeCloseTo(1.0, 2);
    });

    it('объединяет одинаковые компоненты', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1.0, 'mol'));
      mix.addComponent(water, new Moles(0.5, 'mol'));
      expect(mix.getComponents()).toHaveLength(1);
      expect(mix.getComponents()[0].moles).toBeCloseTo(1.5, 5);
    });

    it('игнорирует нулевые и отрицательные количества', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(0, 'mol'));
      mix.addComponent(water, new Moles(-1, 'mol'));
      expect(mix.getComponents()).toHaveLength(0);
    });
  });

  describe('getMass', () => {
    it('возвращает 0 для пустой смеси', () => {
      expect(new Mixture().getMass()).toBe(0);
    });

    it('рассчитывает среднюю молярную массу', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1.0, 'mol'));
      mix.addComponent(ethanol, new Moles(1.0, 'mol'));
      // (18.015 + 46.07) / 2 = 32.04
      expect(mix.getMass()).toBeCloseTo(32.04, 1);
    });

    it('учитывает мольные доли', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(3.0, 'mol'));
      mix.addComponent(ethanol, new Moles(1.0, 'mol'));
      // (3*18.015 + 1*46.07) / 4 = 25.03
      expect(mix.getMass()).toBeCloseTo(25.03, 1);
    });
  });

  describe('getDensity', () => {
    it('возвращает 1.0 для пустой смеси', () => {
      expect(new Mixture().getDensity()).toBe(1.0);
    });

    it('усредняет плотность по объёму', () => {
      const mix = new Mixture();
      // 1 моль воды (18г / 1.0 = 18 мл) + 1 моль этанола (46г / 0.789 = 58.4 мл)
      mix.addComponent(water, new Moles(1.0, 'mol'));
      mix.addComponent(ethanol, new Moles(1.0, 'mol'));
      // Плотность = (18 + 46.07) / (18 + 58.4) ≈ 0.845 г/мл
      const density = mix.getDensity();
      expect(density).toBeCloseTo(0.845, 1);
    });
  });

  describe('getVaporPressure', () => {
    it('возвращает 0 для пустой смеси', () => {
      expect(new Mixture().getVaporPressure(25)).toBe(0);
    });

    it('применяет закон Рауля для идеальной смеси', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1.0, 'mol'));
      mix.addComponent(ethanol, new Moles(1.0, 'mol'));
      const pTotal = mix.getVaporPressure(25);
      const pWater = water.getVaporPressure(25);
      const pEthanol = ethanol.getVaporPressure(25);
      // P = 0.5*P_water + 0.5*P_ethanol
      expect(pTotal).toBeCloseTo(0.5 * pWater + 0.5 * pEthanol, 2);
    });
  });

  describe('getSpecificHeatCapacity', () => {
    it('возвращает теплоёмкость воды для пустой смеси', () => {
      expect(new Mixture().getSpecificHeatCapacity()).toBeCloseTo(4.184, 2);
    });

    it('усредняет теплоёмкость по массе', () => {
      const mix = new Mixture();
      // Равные массы воды и глицерина
      mix.addComponent(water, new Mass(18, 'g'));
      mix.addComponent(glycerin, new Mass(92, 'g'));
      // Мольные доли: вода 1 моль, глицерин 1 моль → 50/50 по молям
      // Но по массе: 18г воды vs 92г глицерина → вода ~16%, глицерин ~84%
      const cp = mix.getSpecificHeatCapacity();
      expect(cp).toBeGreaterThan(2.0);
      expect(cp).toBeLessThan(4.2);
    });
  });

  describe('getViscosity', () => {
    it('возвращает 1.0 для пустой смеси', () => {
      expect(new Mixture().getViscosity(25)).toBeCloseTo(1.0, 1);
    });

    it('применяет логарифмическое правило смешивания', () => {
      // Вязкая жидкость (B=3000 → высокая вязкость) vs вода
      const viscous = new PureSubstance('Viscous', 100, 8, 1500, 200, 1.0, 0, 0.01, 3000);
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1.0, 'mol'));
      mix.addComponent(viscous, new Moles(1.0, 'mol'));
      const viscosity = mix.getViscosity(25);
      // Смесь должна быть вязче чистой воды
      expect(viscosity).toBeGreaterThan(water.getViscosity(25));
    });
  });

  describe('getMeltingPoint', () => {
    it('возвращает -273.15 для пустой смеси', () => {
      expect(new Mixture().getMeltingPoint()).toBe(-273.15);
    });

    it('понижает точку замерзания для водных растворов с электролитами', () => {
      const waterWithSalt = new Mixture();
      waterWithSalt.addComponent(water, new Mass(1000, 'g')); // 1 кг воды
      // Добавляем соль (NaCl как электролит)
      const salt = new PureSubstance('NaCl', 58.44, 8.0, 1500, 200, 2.17, 801)
        .withElectrolyte('salt', [0])
        .withSolubility(360);
      waterWithSalt.addComponent(salt, new Mass(58.44, 'g')); // 1 моль NaCl
      
      const mp = waterWithSalt.getMeltingPoint();
      // Криоскопическое понижение: ΔT = 1.86 * 2 * 1 / 1 = 3.72°C
      expect(mp).toBeLessThan(0);
      expect(mp).toBeGreaterThan(-10);
    });

    it('для чистой воды возвращает 0°C', () => {
      const pure = new Mixture();
      pure.addComponent(water, new Mass(1000, 'g'));
      expect(pure.getMeltingPoint()).toBeCloseTo(0, 1);
    });
  });

  describe('getPKas / getElectrolyteType / getIonicCharge', () => {
    it('возвращает undefined для pKa', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1, 'mol'));
      expect(mix.getPKas()).toBeUndefined();
    });

    it('возвращает neutral для электролита', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1, 'mol'));
      expect(mix.getElectrolyteType()).toBe('neutral');
    });

    it('возвращает 0 для ионного заряда', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1, 'mol'));
      expect(mix.getIonicCharge()).toBe(0);
    });
  });

  describe('getHansenParameters', () => {
    it('возвращает undefined для пустой смеси', () => {
      expect(new Mixture().getHansenParameters()).toBeUndefined();
    });

    it('возвращает undefined если у компонентов нет HSP', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1, 'mol'));
      mix.addComponent(ethanol, new Moles(1, 'mol'));
      expect(mix.getHansenParameters()).toBeUndefined();
    });

    it('усредняет HSP по объёму', () => {
      const withHansen1 = new PureSubstance('A', 100, 8, 1500, 200, 1.0, 0)
        .withHansen(15.0, 10.0, 8.0);
      const withHansen2 = new PureSubstance('B', 100, 8, 1500, 200, 1.0, 0)
        .withHansen(20.0, 5.0, 3.0);
      
      const mix = new Mixture();
      mix.addComponent(withHansen1, new Moles(1, 'mol'));
      mix.addComponent(withHansen2, new Moles(1, 'mol'));
      
      const hsp = mix.getHansenParameters();
      expect(hsp).toBeDefined();
      // Равные объёмы → среднее
      expect(hsp!.dD).toBeCloseTo(17.5, 1);
      expect(hsp!.dP).toBeCloseTo(7.5, 1);
      expect(hsp!.dH).toBeCloseTo(5.5, 1);
    });
  });

  describe('getSolubilityWater', () => {
    it('возвращает 1000 для пустой смеси', () => {
      expect(new Mixture().getSolubilityWater(25, 0)).toBe(1000);
    });

    it('возвращает минимальную растворимость компонентов', () => {
      const lowSol = new PureSubstance('LowSol', 100, 8, 1500, 200, 1.0, 0)
        .withSolubility(10);
      const highSol = new PureSubstance('HighSol', 100, 8, 1500, 200, 1.0, 0)
        .withSolubility(500);
      
      const mix = new Mixture();
      mix.addComponent(lowSol, new Moles(1, 'mol'));
      mix.addComponent(highSol, new Moles(1, 'mol'));
      
      expect(mix.getSolubilityWater(25, 0)).toBeLessThanOrEqual(10);
    });
  });

  describe('массовые конверсии', () => {
    it('massToMoles конвертирует массу в моли через среднюю молярную массу', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1.0, 'mol'));
      mix.addComponent(ethanol, new Moles(1.0, 'mol'));
      const moles = mix.massToMoles(new Mass(mix.getMass(), 'g'));
      // 32.04 г / 32.04 г/моль ≈ 1 моль
      expect(moles.to('mol')).toBeCloseTo(1.0, 1);
    });

    it('molesToMass конвертирует моли в массу', () => {
      const mix = new Mixture();
      mix.addComponent(water, new Moles(1.0, 'mol'));
      const mass = mix.molesToMass(new Moles(2.0, 'mol'));
      expect(mass.to('g')).toBeCloseTo(36.03, 1);
    });
  });
});
