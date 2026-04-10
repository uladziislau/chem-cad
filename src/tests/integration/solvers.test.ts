import { describe, it, expect } from '../../core/testing/mini-runner';
import { MultiphaseSystem } from '../../core/entities/multiphase-system';
import { Phase } from '../../core/entities/phase';
import { Mixture } from '../../core/entities/mixture';
import { PhaseBoundary } from '../../core/entities/phase-boundary';
import { Mass } from '../../core/units/quantities';
import { ViscositySolver } from '../../core/solvers/viscosity-solver';
import { StabilitySolver } from '../../core/solvers/stability-solver';
import { PureSubstance } from '../../core/entities/pure-substance';
import { Oil } from '../../core/entities/oil';

export function runSolversIntegrationTests() {
    describe('Physical Solvers Integration (Физические движки)', () => {
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
        const almondOil = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9);

        it('должен рассчитывать вязкость эмульсии выше, чем у чистой фазы', () => {
            const waterPhase = new Phase(new Mixture(), new Mass(80, 'g'));
            waterPhase.composition.addComponent(water, new Mass(80, 'g'));

            const oilPhase = new Phase(new Mixture(), new Mass(20, 'g'));
            oilPhase.composition.addComponent(almondOil, new Mass(20, 'g'));

            const system = new MultiphaseSystem([waterPhase, oilPhase], []);
            
            const waterViscosity = waterPhase.getViscosity();
            const emulsionViscosity = ViscositySolver.calculateEmulsionViscosity(system);

            expect(emulsionViscosity).toBeGreaterThan(waterViscosity);
        });

        it('должен рассчитывать скорость расслоения (закон Стокса)', () => {
            const waterPhase = new Phase(new Mixture(), new Mass(50, 'g'));
            waterPhase.composition.addComponent(water, new Mass(50, 'g'));

            const oilPhase = new Phase(new Mixture(), new Mass(50, 'g'));
            oilPhase.composition.addComponent(almondOil, new Mass(50, 'g'));

            const system = new MultiphaseSystem([waterPhase, oilPhase], [new PhaseBoundary(waterPhase, oilPhase, 50)]);
            
            const rate = StabilitySolver.calculateSeparationRate(system);
            // Плотность масла 0.9 < 1.0, значит скорость должна быть отрицательной (всплытие/кремирование)
            expect(rate).toBeLessThan(0);
            
            const shelfLife = StabilitySolver.predictShelfLife(system);
            expect(shelfLife).toBeGreaterThan(0);
        });
    });
}
