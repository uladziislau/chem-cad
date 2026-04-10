import { describe, it, expect } from '../../core/testing/mini-runner';
import { MultiphaseSystem } from '../../core/entities/multiphase-system';
import { Phase } from '../../core/entities/phase';
import { Mixture } from '../../core/entities/mixture';
import { PhaseBoundary } from '../../core/entities/phase-boundary';
import { Mass } from '../../core/units/quantities';
import { StabilitySolver } from '../../core/solvers/stability-solver';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Oil } from '../../core/entities/oil';

export function runThermalPhysicalIntegrationTests() {
    describe('Thermal & Physical Integration (Термическая интеграция)', () => {
        
        // Подготовка компонентов
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0, 0, 0.001, 1900);
        const sheaButter = new Oil('Shea Butter', 850, 8.0, 0, 0, false, 0, 0, 0, 0.92, 35, 0.0001, 4000);

        it('вязкость должна падать при нагреве (Arrhenius Chain)', () => {
            const waterPhase = new Phase(new Mixture(), new Mass(100, 'g'), 20);
            waterPhase.composition.addComponent(water, new Mass(100, 'g'));

            const visc20 = waterPhase.getViscosity();
            
            // Нагреваем
            waterPhase.temperatureCelsius = 80;
            const visc80 = waterPhase.getViscosity();

            expect(visc80).toBeLessThan(visc20);
        });

        it('стабильность должна снижаться при нагреве (Stokes Chain)', () => {
            const waterPhase = new Phase(new Mixture(), new Mass(80, 'g'), 20);
            waterPhase.composition.addComponent(water, new Mass(80, 'g'));

            const oilPhase = new Phase(new Mixture(), new Mass(20, 'g'), 20);
            oilPhase.composition.addComponent(sheaButter, new Mass(20, 'g'));

            const system = new MultiphaseSystem([waterPhase, oilPhase], [new PhaseBoundary(waterPhase, oilPhase, 30)]);
            
            const shelfLife20 = StabilitySolver.predictShelfLife(system);
            
            // Нагреваем всю систему
            waterPhase.temperatureCelsius = 60;
            oilPhase.temperatureCelsius = 60;
            
            const shelfLife60 = StabilitySolver.predictShelfLife(system);

            // При 60 градусах вязкость воды ниже -> всплытие капель быстрее -> срок годности меньше
            expect(shelfLife60).toBeLessThan(shelfLife20);
        });

        it('фаза должна застывать ниже точки плавления (Phase Transition)', () => {
            const oilPhase = new Phase(new Mixture(), new Mass(100, 'g'), 40);
            oilPhase.composition.addComponent(sheaButter, new Mass(100, 'g'));

            // При 40°C масло Ши жидкое (Tm = 35°C)
            expect(oilPhase.isSolid()).toBe(false);

            // Охлаждаем до 20°C
            oilPhase.temperatureCelsius = 20;
            expect(oilPhase.isSolid()).toBe(true);
        });

        it('застывание фазы должно блокировать седиментацию (Freeze Lock)', () => {
            const waterPhase = new Phase(new Mixture(), new Mass(80, 'g'), 20);
            waterPhase.composition.addComponent(water, new Mass(80, 'g'));

            const oilPhase = new Phase(new Mixture(), new Mass(20, 'g'), 20);
            oilPhase.composition.addComponent(sheaButter, new Mass(20, 'g'));

            const system = new MultiphaseSystem([waterPhase, oilPhase], [new PhaseBoundary(waterPhase, oilPhase, 30)]);
            
            // При 20°C масло Ши застыло. 
            // Хотя оно легче воды, оно не должно всплывать, так как вязкость фазы огромна.
            const rate = StabilitySolver.calculateSeparationRate(system);
            
            // Скорость должна быть близка к нулю (или крайне мала)
            expect(Math.abs(rate)).toBeLessThan(0.0001);
        });
    });
}
