import { IMultiphaseSystem } from '../entities/multiphase-system.interface';

/**
 * Решатель для расчета вязкости многофазных систем (эмульсий)
 */
export class ViscositySolver {
    /**
     * Рассчитывает вязкость эмульсии (cP)
     * Использует модель Тейлора для учета вязкости обеих фаз
     */
    static calculateEmulsionViscosity(system: IMultiphaseSystem): number {
        if (system.phases.length < 2) return system.phases[0]?.getViscosity() || 0;

        const emulsionType = system.getEmulsionType();
        
        // По умолчанию: 0 - вода, 1 - масло
        let continuousPhase = system.phases[0];
        let dispersedPhase = system.phases[1];

        if (emulsionType === 'W/O') {
            // Если вода в масле, то масло (индекс 1) становится сплошной фазой
            continuousPhase = system.phases[1];
            dispersedPhase = system.phases[0];
        }

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
