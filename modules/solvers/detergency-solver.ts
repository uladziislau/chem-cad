import { IMultiphaseSystem } from '@domain/entities/multiphase-system.interface';
import { MixtureComponent } from '@domain/entities/mixture';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';
import { IonicSolver } from './ionic-solver';

/** Отчёт о моющей способности системы. */
export interface IDetergencyReport {
  /** Общий балл 0–100 */
  readonly score: number;
  /** Эффективность удаления жира (0–100) */
  readonly degreasing: number;
  /** Эффективность удаления налёта (0–100) */
  readonly descaling: number;
  /** Наличие мицеллообразующих ПАВ (0–100) */
  readonly surfactantPower: number;
  /** Рекомендации по улучшению */
  readonly recommendations: string[];
  /** Факторы, влияющие на оценку */
  readonly factors: {
    pH: number;
    ionicStrength: number;
    surfactantPercent: number;
    hlbBalance: number;
  };
}

/**
 * Решатель для оценки моющей способности бытовых средств.
 * Учитывает pH, ионную силу, концентрацию ПАВ и HLB-баланс.
 */
export class DetergencySolver {
  /**
   * Оценивает моющую способность системы.
   */
  static evaluate(system: IMultiphaseSystem): IDetergencyReport {
    const pH = IonicSolver.calculatePH(system);
    const ionicStrength = IonicSolver.calculateIonicStrength(system);
    const surfactantPercent = this.getSurfactantPercent(system);
    const hlbBalance = this.getHLBBalance(system);

    const degreasing = this.scoreDegreasing(pH, surfactantPercent, hlbBalance);
    const descaling = this.scoreDescaling(pH);
    const surfactantPower = this.scoreSurfactant(surfactantPercent, ionicStrength);

    const score = Math.round(
      degreasing * 0.45 +
      descaling * 0.25 +
      surfactantPower * 0.30
    );

    const recommendations = this.buildRecommendations(pH, surfactantPercent, ionicStrength, score);

    return {
      score,
      degreasing: Math.round(degreasing),
      descaling: Math.round(descaling),
      surfactantPower: Math.round(surfactantPower),
      recommendations,
      factors: {
        pH,
        ionicStrength,
        surfactantPercent,
        hlbBalance
      }
    };
  }

  /** Процент ПАВ в общей массе системы. */
  private static getSurfactantPercent(system: IMultiphaseSystem): number {
    const components = system.getGlobalComposition().getComponents();
    const totalMass = components.reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);
    if (totalMass <= 0) return 0;

    const surfactantMass = components
      .filter(c => this.isSurfactant(c))
      .reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);

    return (surfactantMass / totalMass) * 100;
  }

  /** Проверяет, является ли компонент ПАВ. */
  private static isSurfactant(c: MixtureComponent): boolean {
    const name = c.entity.getName().toLowerCase();
    return (
      name.includes('polysorbate') || name.includes('sls') || name.includes('лаурет') ||
      name.includes('coco') || name.includes('cetrimonium') || name.includes('sulfate') ||
      name.includes('sulfonate') || name.includes('ether') || name.includes('эмульгатор') ||
      c.entity.getElectrolyteType() === 'salt' && name.includes('sodium')
    );
  }

  /** HLB-баланс: отклонение от оптимального диапазона 11–15. */
  private static getHLBBalance(system: IMultiphaseSystem): number {
    const components = system.getGlobalComposition().getComponents();
    const surfactants = components.filter(c => this.isSurfactant(c));
    if (surfactants.length === 0) return 0;

    let weightedHLB = 0;
    let totalMass = 0;
    for (const c of surfactants) {
      const entity = c.entity;
      const hlb = this.getHlb(entity);
      if (hlb !== undefined) {
        const mass = c.moles * entity.getMass();
        weightedHLB += hlb * mass;
        totalMass += mass;
      }
    }

    if (totalMass === 0) return 0;
    const avgHLB = weightedHLB / totalMass;
    // Оптимум для очистки — 11–15
    if (avgHLB >= 11 && avgHLB <= 15) return 1.0;
    if (avgHLB < 11) return Math.max(0, avgHLB / 11);
    return Math.max(0, 1 - (avgHLB - 15) / 10);
  }

  /** Безопасно извлекает HLB из сущности (если это ISurfactant). */
  private static getHlb(entity: IChemicalEntity): number | undefined {
    if ('hlb' in entity && typeof entity.hlb === 'number') {
      return entity.hlb;
    }
    return undefined;
  }

  /** Оценка удаления жира: щелочная среда + ПАВ + правильный HLB. */
  private static scoreDegreasing(pH: number, surfactantPercent: number, hlbBalance: number): number {
    const pHScore = pH >= 9 && pH <= 12 ? 100 : pH >= 7 ? 60 : pH >= 5 ? 30 : 10;
    const surfScore = Math.min(surfactantPercent * 8, 100);
    const hlbScore = hlbBalance * 100;
    return (pHScore * 0.4 + surfScore * 0.35 + hlbScore * 0.25);
  }

  /** Оценка удаления налёта: кислая среда (pH 2–4) растворяет минеральные отложения. */
  private static scoreDescaling(pH: number): number {
    if (pH >= 2 && pH <= 4) return 100;
    if (pH >= 4 && pH <= 6) return 50;
    if (pH < 2) return 30; // Слишком кислая — опасно
    return 10; // Нейтральная/щелочная — не удаляет налёт
  }

  /** Оценка ПАВ-мощности: концентрация и отсутствие подавления ионной силой. */
  private static scoreSurfactant(surfactantPercent: number, ionicStrength: number): number {
    const concScore = Math.min(surfactantPercent * 6, 80);
    // Высокая ионная сила подавляет мицеллообразование
    const ionicPenalty = Math.max(0, 100 - ionicStrength * 150);
    return (concScore * 0.6 + ionicPenalty * 0.4);
  }

  /** Формирует рекомендации по улучшению. */
  private static buildRecommendations(
    pH: number,
    surfactantPercent: number,
    ionicStrength: number,
    score: number
  ): string[] {
    const recs: string[] = [];

    if (pH < 7) {
      recs.push('Для лучшего удаления жира повысьте pH до 9–11 (добавьте щелочь)');
    } else if (pH > 12) {
      recs.push('pH слишком высокий — снизьте до 10–11 для безопасности и эффективности');
    }

    if (surfactantPercent < 3) {
      recs.push(`Концентрация ПАВ низкая (${surfactantPercent.toFixed(1)}%). Добавьте 3–8% для мицелл`);
    } else if (surfactantPercent > 15) {
      recs.push('Избыток ПАВ может вызвать раздражение кожи. Оптимум 5–10%');
    }

    if (ionicStrength > 0.3) {
      recs.push('Высокая ионная сила подавляет ПАВ. Снизьте концентрацию солей');
    }

    if (score < 40) {
      recs.push('Низкая моющая способность. Рассмотрите добавление щелочных компонентов и ПАВ');
    } else if (score > 80) {
      recs.push('Отличная моющая способность! Рецептура сбалансирована');
    }

    return recs;
  }
}
