import { IOil, ISurfactant } from '../entities/surfactant.interface';
import { Mixture } from '../entities/mixture';
import { EmulsionSolver } from './emulsion-solver';
import { PureSubstance } from '../entities/pure-substance';
import { Mass } from '../units/quantities';

export interface IOptimizationCriteria {
    targetHLB: number;
    maxPricePerKg?: number;
    requireEco?: boolean;
    weights: {
        price: number;      // 0..1
        irritation: number; // 0..1
    };
}

export interface FormulationReport {
    mixture: Mixture;
    totalCost: number;
    averageIrritation: number;
    isEco: boolean;
    surfactantsUsed: { name: string, amount: number }[];
}

export class AutoFormulator {
    /**
     * Умная оптимизация рецептуры на основе множества критериев
     */
    static optimizeEmulsion(
        oilPhase: IOil,
        oilMass: Mass,
        waterPhase: PureSubstance,
        waterMass: Mass,
        availableSurfactants: ISurfactant[],
        totalSurfactantMass: Mass = new Mass(5, 'g')
    ): FormulationReport {
        const criteria: IOptimizationCriteria = {
            targetHLB: oilPhase.requiredHlb,
            weights: { price: 0.5, irritation: 0.5 }
        };

        // 1. Фильтрация
        let candidates = availableSurfactants;
        if (criteria.requireEco) {
            candidates = candidates.filter(s => s.isEcoCertified);
        }

        const lowHLB = candidates.filter(s => s.hlb < criteria.targetHLB);
        const highHLB = candidates.filter(s => s.hlb >= criteria.targetHLB);

        if (lowHLB.length === 0 || highHLB.length === 0) {
            throw new Error('Невозможно подобрать оптимальную пару ПАВ');
        }

        // 2. Перебор всех возможных пар и скоринг
        const options: FormulationReport[] = [];

        for (const sA of lowHLB) {
            for (const sB of highHLB) {
                try {
                    const blend = EmulsionSolver.calculateSurfactantBlend(sA, sB, criteria.targetHLB);
                    
                    const mixture = new Mixture();
                    mixture.addComponent(waterPhase, waterMass);
                    mixture.addComponent(oilPhase, oilMass);
                    
                    const massA = blend.surfactantAAmount * totalSurfactantMass.to('g');
                    const massB = blend.surfactantBAmount * totalSurfactantMass.to('g');
                    
                    mixture.addComponent(sA, new Mass(massA, 'g'));
                    mixture.addComponent(sB, new Mass(massB, 'g'));

                    const totalCost = (massA / 1000 * sA.pricePerKg) + (massB / 1000 * sB.pricePerKg);
                    const avgIrritation = (blend.surfactantAAmount * sA.irritationIndex) + (blend.surfactantBAmount * sB.irritationIndex);

                    options.push({
                        mixture,
                        totalCost,
                        averageIrritation: avgIrritation,
                        isEco: sA.isEcoCertified && sB.isEcoCertified,
                        surfactantsUsed: [
                            { name: sA.name, amount: massA },
                            { name: sB.name, amount: massB }
                        ]
                    });
                } catch { continue; }
            }
        }

        if (options.length === 0) {
            throw new Error('Не найдено подходящих вариантов рецептуры');
        }

        // 3. Выбор лучшего по Score
        return options.sort((a, b) => 
            (a.totalCost * criteria.weights.price + a.averageIrritation * criteria.weights.irritation) -
            (b.totalCost * criteria.weights.price + b.averageIrritation * criteria.weights.irritation)
        )[0];
    }

    /**
     * Упрощенный метод (совместимость)
     */
    static createStableEmulsion(
        oilPhase: IOil,
        oilAmount: number,
        waterPhase: PureSubstance,
        waterAmount: number,
        availableSurfactants: ISurfactant[],
        totalSurfactantAmount = 5.0
    ): Mixture {
        const report = this.optimizeEmulsion(
            oilPhase, new Mass(oilAmount, 'g'),
            waterPhase, new Mass(waterAmount, 'g'),
            availableSurfactants, new Mass(totalSurfactantAmount, 'g')
        );
        return report.mixture;
    }
}
