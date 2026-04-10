import { IMultiphaseSystem } from '../entities/multiphase-system.interface';
import { ISurfactant } from '../entities/surfactant.interface';
import { IOil } from '../entities/surfactant.interface';

export class FormulationSolver {
    /**
     * Рассчитывает фактический HLB системы ПАВ (взвешенное среднее)
     */
    static calculateSystemHLB(system: IMultiphaseSystem): number {
        let totalSurfactantMoles = 0;
        let weightedHLB = 0;

        // Собираем все ПАВ из всех фаз и границ
        const globalComposition = system.getGlobalComposition();
        for (const comp of globalComposition.getComponents()) {
            const entity = comp.entity;
            if ('hlb' in entity) {
                const surfactant = entity as unknown as ISurfactant;
                weightedHLB += surfactant.hlb * comp.moles;
                totalSurfactantMoles += comp.moles;
            }
        }

        if (totalSurfactantMoles === 0) return 0;
        return weightedHLB / totalSurfactantMoles;
    }

    /**
     * Рассчитывает требуемый HLB масляной фазы (взвешенное среднее)
     */
    static calculateRequiredHLB(system: IMultiphaseSystem): number {
        let totalOilMass = 0;
        let weightedReqHLB = 0;

        const globalComposition = system.getGlobalComposition();
        for (const comp of globalComposition.getComponents()) {
            const entity = comp.entity;
            if ('requiredHlb' in entity) {
                const oil = entity as unknown as IOil;
                const mass = comp.moles * entity.getMass();
                weightedReqHLB += oil.requiredHlb * mass;
                totalOilMass += mass;
            }
        }

        if (totalOilMass === 0) return 7.0; // По умолчанию для "среднего" масла
        return weightedReqHLB / totalOilMass;
    }

    /**
     * Рассчитывает отклонение HLB
     */
    static calculateHLBMismatch(system: IMultiphaseSystem): number {
        const actual = this.calculateSystemHLB(system);
        const required = this.calculateRequiredHLB(system);
        
        if (actual === 0) return 10; // Максимальный штраф если нет ПАВ
        return Math.abs(actual - required);
    }

    /**
     * Рассчитывает HLD (Hydrophilic-Lipophilic Difference) системы
     * HLD = F(S) - k*EACN + Cc + aT*(T - 25)
     */
    static calculateHLD(system: IMultiphaseSystem, temperatureCelsius: number): number {
        const globalComposition = system.getGlobalComposition();
        
        // 1. Средний Cc ПАВ
        let totalSurfactantMoles = 0;
        let weightedCc = 0;
        for (const comp of globalComposition.getComponents()) {
            const entity = comp.entity;
            if ('cc' in entity) {
                const surfactant = entity as unknown as ISurfactant;
                weightedCc += (surfactant.cc || 0) * comp.moles;
                totalSurfactantMoles += comp.moles;
            }
        }
        const avgCc = totalSurfactantMoles > 0 ? weightedCc / totalSurfactantMoles : 0;

        // 2. Средний EACN масел
        let totalOilMass = 0;
        let weightedEacn = 0;
        for (const comp of globalComposition.getComponents()) {
            const entity = comp.entity;
            if ('eacn' in entity) {
                const oil = entity as unknown as IOil;
                const mass = comp.moles * entity.getMass();
                weightedEacn += (oil.eacn || 10) * mass;
                totalOilMass += mass;
            }
        }
        const avgEacn = totalOilMass > 0 ? weightedEacn / totalOilMass : 10;

        // 3. Соленость (S) в г/100мл (wt%)
        // Ищем водную фазу
        const waterPhase = system.phases.find(p => p.composition.getComponents().some(c => c.entity.getName().toLowerCase().includes('water')));
        let salinity = 0;
        if (waterPhase) {
            let saltMass = 0;
            for (const comp of waterPhase.composition.getComponents()) {
                if (comp.entity.getIonicCharge() !== 0 || comp.entity.getName().toLowerCase().includes('salt')) {
                    saltMass += comp.moles * comp.entity.getMass();
                }
            }
            const waterMass = waterPhase.totalMass.to('g');
            salinity = waterMass > 0 ? (saltMass / waterMass) * 100 : 0;
        }

        // 4. Расчет HLD
        // Упрощенная модель: HLD = 0.17*S - 0.15*EACN + Cc + 0.06*(T - 25)
        // HLD = 0 -> Оптимальная микроэмульсия (минимальное IFT)
        // HLD < 0 -> O/W эмульсия
        // HLD > 0 -> W/O эмульсия
        
        const k = 0.15;
        const aT = 0.06;
        const bS = 0.17;

        return (bS * salinity) - (k * avgEacn) + avgCc + (aT * (temperatureCelsius - 25));
    }

    /**
     * Прогнозирует тип эмульсии на основе HLD (более точно) и ГЛБ
     */
    static predictEmulsionType(system: IMultiphaseSystem, temperatureCelsius = 25): 'O/W' | 'W/O' | 'Multiple' | 'Unknown' {
        if (system.phases.length < 2) return 'Unknown';

        const hld = this.calculateHLD(system, temperatureCelsius);
        const hlb = this.calculateSystemHLB(system);
        
        // Находим водную и масляную фазы (упрощенно: 0 - вода, 1 - масло)
        const waterPhase = system.phases[0];
        const oilPhase = system.phases[1];
        
        const volWater = waterPhase.getVolume().to('ml');
        const volOil = oilPhase.getVolume().to('ml');
        const totalVol = volWater + volOil;
        
        if (totalVol === 0) return 'Unknown';
        
        const phiOil = volOil / totalVol;
        const phiWater = volWater / totalVol;

        // 1. Приоритет HLD (если есть ПАВ)
        let type: 'O/W' | 'W/O' = 'Unknown' as any;
        
        if (hlb > 0) {
            // HLD < 0 -> O/W
            // HLD > 0 -> W/O
            // HLD ≈ 0 -> Нестабильная/Микроэмульсия (но для макро-эмульсий обычно O/W или W/O)
            type = hld <= 0 ? 'O/W' : 'W/O';
        } else {
            // Если нет ПАВ, просто по объему
            type = phiWater > phiOil ? 'O/W' : 'W/O';
        }

        // 2. Геометрические ограничения (Инверсия фаз)
        // Если объем дисперсной фазы > 70%, она стремится стать сплошной
        if (type === 'O/W' && phiOil > 0.74) return 'W/O';
        if (type === 'W/O' && phiWater > 0.74) return 'O/W';

        return type;
    }
}
