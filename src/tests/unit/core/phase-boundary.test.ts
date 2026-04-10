import { describe, it, expect } from '../../../core/testing/mini-runner';
import { PureSubstance } from '../../../core/entities/pure-substance';
import { Mixture } from '../../../core/entities/mixture';
import { Phase } from '../../../core/entities/phase';
import { PhaseBoundary } from '../../../core/entities/phase-boundary';
import { Oil } from '../../../core/entities/oil';
import { Surfactant } from '../../../core/entities/surfactant';
import { Mass, Moles } from '../../../core/units/quantities';

export function runPhaseBoundaryTests() {
    describe('PhaseBoundary (Поверхностные явления)', () => {
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
        const almondOil = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9);
        const tween80 = new Surfactant('Tween 80', 1310, 15.0, 45.0, 2, true);

        it('должен снижать межфазное натяжение при добавлении ПАВ', () => {
            const waterPhase = new Phase(new Mixture(), new Mass(100, 'g'));
            waterPhase.composition.addComponent(water, new Mass(100, 'g'));

            const oilPhase = new Phase(new Mixture(), new Mass(100, 'g'));
            oilPhase.composition.addComponent(almondOil, new Mass(100, 'g'));

            const boundary = new PhaseBoundary(waterPhase, oilPhase, 50.0);
            
            const initialTension = boundary.getInterfacialTension();
            expect(initialTension).toBe(50.0);

            boundary.addSurfactant(tween80, new Moles(0.01, 'mol'));
            const reducedTension = boundary.getInterfacialTension();

            expect(reducedTension).toBeLessThan(initialTension);
        });
    });
}
