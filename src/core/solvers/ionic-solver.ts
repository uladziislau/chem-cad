import { IMultiphaseSystem } from '../entities/multiphase-system.interface';
import { PHSolver } from './ph-solver';

/**
 * Решатель для расчета pH и ионной силы системы
 */
export class IonicSolver {
    /**
     * Рассчитывает pH водной фазы (первой фазы системы)
     */
    static calculatePH(system: IMultiphaseSystem): number {
        return PHSolver.calculatePH(system);
    }

    /**
     * Рассчитывает ионную силу водной фазы
     * I = 0.5 * sum(c_i * z_i^2)
     */
    static calculateIonicStrength(system: IMultiphaseSystem): number {
        if (system.phases.length === 0) return 0;
        
        const waterPhase = system.phases[0];
        const components = waterPhase.composition.getComponents();
        const volumeL = waterPhase.getVolume().to('l');
        
        let ionicStrength = 0;
        for (const c of components) {
            const charge = c.entity.getIonicCharge();
            const type = c.entity.getElectrolyteType();
            
            if (type === 'salt' || charge !== 0) {
                const molarity = c.moles / volumeL;
                const z = Math.abs(charge !== 0 ? charge : 1);
                
                // Для электролита типа A_x B_y ионная сила I = 0.5 * sum(c_i * z_i^2)
                // Упрощенно для бинарных электролитов: 
                // Если z=1 (NaCl), I = M
                // Если z=2 (CaCl2), I = 3M
                // Если z=3 (AlCl3), I = 6M
                // Формула: I = M * z * (z + 1) / 2  -- Нет, это не совсем так.
                
                // Будем считать, что charge - это заряд главного иона, 
                // и есть достаточное количество противоионов с зарядом 1.
                // Тогда I = 0.5 * (M * z^2 + (M * z) * 1^2) = 0.5 * (M * z^2 + M * z) = 0.5 * M * z * (z + 1)
                ionicStrength += 0.5 * molarity * z * (z + 1);
            }
        }
        
        return ionicStrength;
    }

    /**
     * Рассчитывает коэффициент снижения вязкости из-за электролитов
     * (для полимерных загустителей)
     */
    static getElectrolyteViscosityFactor(system: IMultiphaseSystem): number {
        const I = this.calculateIonicStrength(system);
        // Эмпирическая модель: вязкость падает экспоненциально при росте ионной силы
        // Для I = 0 factor = 1.0, для I = 0.5 factor ~ 0.2
        return Math.exp(-I * 3.0);
    }
}
