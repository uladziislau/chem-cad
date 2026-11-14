import { IMultiphaseSystem } from '../entities/multiphase-system.interface';
import { PhaseTopologyHelper } from './phase-topology.helper';

/**
 * Решатель для расчета вязкости многофазных систем (эмульсий)
 */
export class ViscositySolver {
    /**
     * Рассчитывает вязкость эмульсии (cP)
     * Использует модель Тейлора для учета вязкости обеих фаз
     */
    static calculateEmulsionViscosity(system: IMultiphaseSystem): number {
        const roles = PhaseTopologyHelper.resolveEmulsionRoles(system);
        if (!roles) return system.phases[0]?.getViscosity() || 0;

        const { continuousPhase, dispersedPhase } = roles;

        const eta0 = continuousPhase.getViscosity() || 1.0;
        const etad = dispersedPhase.getViscosity() || 1.0;

        // Расчет объемной доли дисперсной фазы (phi)
        const vTotal = system.phases.reduce((sum, p) => sum + p.getVolume().to('ml'), 0);
        const vDispersed = dispersedPhase.getVolume().to('ml');
        const phi = vTotal > 0 ? vDispersed / vTotal : 0;

        // Модель Тейлора: eta = eta0 * (1 + 2.5 * phi * ((etad + 0.4*eta0) / (etad + eta0)))
        const denominator = etad + eta0;
        const taylorFactor = denominator > 0 ? (etad + 0.4 * eta0) / denominator : 1.0;
        const emulsionViscosity = eta0 * (1 + 2.5 * phi * taylorFactor);

        return isNaN(emulsionViscosity) ? eta0 : emulsionViscosity;
    }
}
