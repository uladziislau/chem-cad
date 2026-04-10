import { runQuantitiesTests } from './unit/core/quantities.test';
import { runPhaseTests } from './unit/core/phase.test';
import { runPhaseBoundaryTests } from './unit/core/phase-boundary.test';
import { runMultiphaseSystemTests } from './unit/core/multiphase-system.test';
import { runThermodynamicsIntegrationTests } from './integration/thermodynamics.test';
import { runFormulatorIntegrationTests } from './integration/formulator.test';
import { runSolversIntegrationTests } from './integration/solvers.test';
import { runThermalPhysicalIntegrationTests } from './integration/thermal-physical.test';
import { describe } from '../core/testing/mini-runner';

/**
 * Центральный реестр всех тестов системы ChemCore
 */
export function runAllTests() {
    describe('ChemCore Test Suite (Централизованный запуск)', () => {
        // Unit Tests
        runQuantitiesTests();
        runPhaseTests();
        runPhaseBoundaryTests();
        runMultiphaseSystemTests();

        // Integration Tests
        runThermodynamicsIntegrationTests();
        runFormulatorIntegrationTests();
        runSolversIntegrationTests();
        runThermalPhysicalIntegrationTests();
    });
}
