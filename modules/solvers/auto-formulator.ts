import { IOil, ISurfactant } from '@domain/entities/surfactant.interface';
import { Mixture, MixtureComponent } from '@domain/entities/mixture';
import { EmulsionSolver } from './emulsion-solver';
import { PureSubstance } from '@domain/entities/pure-substance';
import { Mass, Moles } from '@root-modules/units/quantities';
import { Phase } from '@domain/entities/phase';
import { PhaseBoundary } from '@domain/entities/phase-boundary';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { DetergencySolver } from './detergency-solver';
import { DryingSolver } from './drying-solver';

export interface IOptimizationCriteria {
    targetHLB: number;
    maxPricePerKg?: number;
    requireEco?: boolean;
    weights: {
        price: number;      // 0..1
        irritation: number; // 0..1
    };
}

/** Целевые показатели рецептуры, проверяемые солверами. */
export interface IFormulationTargets {
    /** Минимальный балл моющей способности DetergencySolver (0–100). */
    minDetergencyScore?: number;
    /** Максимальное время высыхания DryingSolver до «сухого на отлип», мин. */
    maxTouchDryTimeMin?: number;
    /** Максимальное время полной полимеризации DryingSolver, мин. */
    maxFullDryTimeMin?: number;
}

export interface FormulationReport {
    mixture: Mixture;
    totalCost: number;
    averageIrritation: number;
    isEco: boolean;
    surfactantsUsed: { name: string, amount: number }[];
    /** Балл моющей способности (0–100), если оценивался. */
    detergencyScore?: number;
    /** Время «сухого на отлип», мин, если оценивалось. */
    touchDryTimeMin?: number;
    /** Время полной полимеризации, мин, если оценивалось. */
    fullDryTimeMin?: number;
    /** Механизм высыхания. */
    dryingMechanism?: 'evaporation' | 'oxidation' | 'hybrid';
}

export class AutoFormulator {
    /**
     * Умная оптимизация рецептуры на основе множества критериев.
     * Если переданы targets — каждый кандидат оценивается DetergencySolver
     * и DryingSolver, а нарушения целей добавляют штраф к итоговому score.
     */
    static optimizeEmulsion(
        oilPhase: IOil,
        oilMass: Mass,
        waterPhase: PureSubstance,
        waterMass: Mass,
        availableSurfactants: ISurfactant[],
        totalSurfactantMass: Mass = new Mass(5, 'g'),
        targets?: IFormulationTargets,
        temperatureCelsius = 25
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
        const options: (FormulationReport & { totalScore: number })[] = [];

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

                    const report: FormulationReport = {
                        mixture,
                        totalCost,
                        averageIrritation: avgIrritation,
                        isEco: sA.isEcoCertified && sB.isEcoCertified,
                        surfactantsUsed: [
                            { name: sA.name, amount: massA },
                            { name: sB.name, amount: massB }
                        ]
                    };

                    // 3. Оценка солверами, если заданы целевые показатели
                    let penalty = 0;
                    const wantsDetergency = targets?.minDetergencyScore !== undefined;
                    const wantsDrying = targets?.maxTouchDryTimeMin !== undefined ||
                        targets?.maxFullDryTimeMin !== undefined;

                    if (targets && (wantsDetergency || wantsDrying)) {
                        const system = this.buildEvaluationSystem(mixture, temperatureCelsius);

                        if (wantsDetergency) {
                            const det = DetergencySolver.evaluate(system);
                            report.detergencyScore = det.score;
                            if (det.score < targets.minDetergencyScore!) {
                                penalty += (targets.minDetergencyScore! - det.score) / 100;
                            }
                        }

                        if (wantsDrying) {
                            const dry = DryingSolver.evaluate(system, temperatureCelsius);
                            report.touchDryTimeMin = dry.touchDryTimeMin;
                            report.fullDryTimeMin = dry.fullDryTimeMin;
                            report.dryingMechanism = dry.mechanism;
                            if (targets.maxTouchDryTimeMin !== undefined &&
                                dry.touchDryTimeMin > targets.maxTouchDryTimeMin) {
                                penalty += (dry.touchDryTimeMin - targets.maxTouchDryTimeMin) / Math.max(targets.maxTouchDryTimeMin, 1);
                            }
                            if (targets.maxFullDryTimeMin !== undefined &&
                                dry.fullDryTimeMin > targets.maxFullDryTimeMin) {
                                penalty += (dry.fullDryTimeMin - targets.maxFullDryTimeMin) / Math.max(targets.maxFullDryTimeMin, 1);
                            }
                        }
                    }

                    const totalScore =
                        totalCost * criteria.weights.price +
                        avgIrritation * criteria.weights.irritation +
                        penalty;

                    options.push({ ...report, totalScore });
                } catch { continue; }
            }
        }

        if (options.length === 0) {
            throw new Error('Не найдено подходящих вариантов рецептуры');
        }

        // 4. Выбор лучшего по взвешенному Score
        return options.sort((a, b) => a.totalScore - b.totalScore)[0];
    }

    /**
     * Строит MultiphaseSystem из итоговой Mixture для оценки солверами.
     * Компоненты классифицируются: масло (IOil) → масляная фаза,
     * ПАВ (hlb) → граница фаз (или водная фаза при одной фазе),
     * остальное → водная фаза.
     */
    private static buildEvaluationSystem(mixture: Mixture, temperatureCelsius: number): MultiphaseSystem {
        const aqueous = new Mixture();
        const oil = new Mixture();
        const surfactantComponents: { entity: ISurfactant; moles: number }[] = [];

        const components: MixtureComponent[] = mixture.getComponents();
        for (const c of components) {
            const entity = c.entity;
            const mass = new Mass(c.moles * entity.getMass(), 'g');
            if ('hlb' in entity && typeof entity.hlb === 'number') {
                surfactantComponents.push({ entity: entity as unknown as ISurfactant, moles: c.moles });
            } else if ('requiredHlb' in entity || entity.getName().toLowerCase().includes('oil')) {
                oil.addComponent(entity, mass);
            } else {
                aqueous.addComponent(entity, mass);
            }
        }

        const massOf = (mix: Mixture): number =>
            mix.getComponents().reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);

        const phases: Phase[] = [];
        const boundaries: PhaseBoundary[] = [];
        const aqMass = massOf(aqueous);
        const oilMassVal = massOf(oil);

        if (aqMass > 0) phases.push(new Phase(aqueous, new Mass(aqMass, 'g'), temperatureCelsius));
        if (oilMassVal > 0) phases.push(new Phase(oil, new Mass(oilMassVal, 'g'), temperatureCelsius));

        if (phases.length === 0) {
            // Нет ни водной, ни масляной фазы — всё в одну фазу
            const all = new Mixture();
            for (const c of components) {
                all.addComponent(c.entity, new Mass(c.moles * c.entity.getMass(), 'g'));
            }
            const total = massOf(all);
            if (total > 0) phases.push(new Phase(all, new Mass(total, 'g'), temperatureCelsius));
        } else if (phases.length === 1) {
            // Одна фаза — ПАВ добавляем в неё
            const phase = phases[0];
            let extra = 0;
            for (const s of surfactantComponents) {
                const mass = s.moles * s.entity.getMass();
                if (mass > 0) {
                    phase.composition.addComponent(s.entity, new Mass(mass, 'g'));
                    extra += mass;
                }
            }
            if (extra > 0) {
                (phase as { totalMass: Mass }).totalMass = new Mass(phase.totalMass.to('g') + extra, 'g');
            }
        } else {
            // Две фазы — ПАВ на границу
            const boundary = new PhaseBoundary(phases[0], phases[1], 50);
            for (const s of surfactantComponents) {
                boundary.addSurfactant(s.entity, new Moles(s.moles, 'mol'));
            }
            boundaries.push(boundary);
        }

        return new MultiphaseSystem(phases, boundaries);
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
