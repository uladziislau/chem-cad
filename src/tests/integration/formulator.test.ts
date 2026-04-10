import { describe, it, expect } from '../../core/testing/mini-runner';
import { Oil } from '../../core/entities/oil';
import { Surfactant } from '../../core/entities/surfactant';
import { AutoFormulator } from '../../core/solvers/auto-formulator';
import { Mass } from '../../core/units/quantities';
import { PureSubstance } from '../../core/entities/pure-substance';

export function runFormulatorIntegrationTests() {
    describe('AutoFormulator Integration (Оптимизация)', () => {
        const water = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0);
        const almondOil = new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9);
        const surfactantsDB = [
            new Surfactant('Span 80', 428.6, 4.3, 15.0, 1, true),
            new Surfactant('Tween 80', 1310, 15.0, 45.0, 2, true)
        ];

        it('должен подобрать оптимальную рецептуру эмульсии', () => {
            const report = AutoFormulator.optimizeEmulsion(
                almondOil, new Mass(20, 'g'),
                water, new Mass(75, 'g'),
                surfactantsDB, new Mass(5, 'g')
            );

            expect(report.totalCost).toBeGreaterThan(0);
            expect(report.mixture).toBeDefined();
            expect(report.surfactantsUsed.length).toBeGreaterThan(0);
        });
    });
}
