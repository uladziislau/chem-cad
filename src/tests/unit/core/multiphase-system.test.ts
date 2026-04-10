import { describe, it, expect } from '../../../core/testing/mini-runner';
import { MultiphaseSystem } from '../../../core/entities/multiphase-system';
import { Phase } from '../../../core/entities/phase';
import { Mixture } from '../../../core/entities/mixture';
import { PhaseBoundary } from '../../../core/entities/phase-boundary';
import { Mass } from '../../../core/units/quantities';

export function runMultiphaseSystemTests() {
    describe('MultiphaseSystem (Эмульсионный контейнер)', () => {
        it('должен рассчитывать индекс стабильности', () => {
            const phase1 = new Phase(new Mixture(), new Mass(100, 'g'));
            const phase2 = new Phase(new Mixture(), new Mass(100, 'g'));
            const boundary = new PhaseBoundary(phase1, phase2, 50.0);
            
            const system = new MultiphaseSystem([phase1, phase2], [boundary]);
            
            const stability = system.getStabilityIndex();
            expect(stability).toBeGreaterThan(0);
            expect(stability).toBeLessThanOrEqual(1.0);
        });

        it('должен симулировать старение (рост капель)', () => {
            const phase1 = new Phase(new Mixture(), new Mass(100, 'g'));
            const phase2 = new Phase(new Mixture(), new Mass(100, 'g'));
            const boundary = new PhaseBoundary(phase1, phase2, 50.0);
            const system = new MultiphaseSystem([phase1, phase2], [boundary]);
            
            const initialSize = system.getDropletSize();
            system.simulateAging(24); // 24 часа
            
            expect(system.getDropletSize()).toBeGreaterThan(initialSize);
        });
    });
}
