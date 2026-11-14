import { IMultiphaseSystem } from '@domain/entities/multiphase-system.interface';
import { MixtureComponent } from '@domain/entities/mixture';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';

/** Отчёт о времени высыхания покрытия. */
export interface IDryingReport {
  /** Общее время высыхания до «сухого на отлип» (минуты) */
  readonly touchDryTimeMin: number;
  /** Общее время полной полимеризации (минуты) */
  readonly fullDryTimeMin: number;
  /** Стадии высыхания */
  readonly stages: IDryingStage[];
  /** Доля летучих компонентов (%) */
  readonly volatilePercent: number;
  /** Тип высыхания: evaporation / oxidation / hybrid */
  readonly mechanism: 'evaporation' | 'oxidation' | 'hybrid';
  /** Рекомендации */
  readonly recommendations: string[];
}

export interface IDryingStage {
  readonly name: string;
  readonly description: string;
  readonly durationMin: number;
  readonly percentComplete: number;
}

/** Константы для модели полимеризации масел. */
const OXIDATION_RATE = 0.15; // Константа скорости окислительной полимеризации
const EVAPORATION_FACTOR = 0.8; // Эмпирический коэффициент испарения

/**
 * Решатель для расчёта времени высыхания покрытий и лаков.
 * Учитывает испарение растворителей (Антуан) и окислительную полимеризацию масел.
 */
export class DryingSolver {
  /**
   * Оценивает время высыхания системы.
   */
  static evaluate(system: IMultiphaseSystem, temperatureCelsius = 25): IDryingReport {
    const components = system.getGlobalComposition().getComponents();
    const totalMass = this.getTotalMass(components);
    if (totalMass <= 0) {
      return { touchDryTimeMin: 0, fullDryTimeMin: 0, stages: [], volatilePercent: 0, mechanism: 'evaporation', recommendations: [] };
    }

    // Анализ компонентов
    const volatileComponents = components.filter(c => this.isVolatile(c));
    const oilComponents = components.filter(c => this.isDryingOil(c));
    const volatileMass = volatileComponents.reduce((s, c) => s + c.moles * c.entity.getMass(), 0);
    const volatilePercent = (volatileMass / totalMass) * 100;

    // Механизм высыхания
    const mechanism = this.determineMechanism(volatilePercent, oilComponents.length);

    // Расчёт времени
    const evaporationTime = this.calculateEvaporationTime(volatileComponents, volatileMass, temperatureCelsius);
    const polymerizationTime = this.calculatePolymerizationTime(oilComponents, totalMass, temperatureCelsius);

    const touchDryTimeMin = Math.round(Math.min(evaporationTime, polymerizationTime));
    const fullDryTimeMin = Math.round(Math.max(evaporationTime, polymerizationTime));

    const stages = this.buildStages(evaporationTime, polymerizationTime, mechanism);
    const recommendations = this.buildRecommendations(mechanism, volatilePercent, touchDryTimeMin);

    return {
      touchDryTimeMin,
      fullDryTimeMin,
      stages,
      volatilePercent: Math.round(volatilePercent * 10) / 10,
      mechanism,
      recommendations
    };
  }

  /** Определяет механизм высыхания. */
  private static determineMechanism(volatilePercent: number, oilCount: number): 'evaporation' | 'oxidation' | 'hybrid' {
    if (volatilePercent > 30 && oilCount > 0) return 'hybrid';
    if (volatilePercent > 30) return 'evaporation';
    if (oilCount > 0) return 'oxidation';
    return 'evaporation';
  }

  /** Проверяет, является ли компонент летучим растворителем. */
  private static isVolatile(c: MixtureComponent): boolean {
    const bp = this.getBoilingPoint(c.entity);
    return bp > 0 && bp < 200; // Летучие — температура кипения < 200°C
  }

  /** Проверяет, является ли компонент высыхающим маслом. */
  private static isDryingOil(c: MixtureComponent): boolean {
    const name = c.entity.getName().toLowerCase();
    return (
      name.includes('linseed') || name.includes('льнян') ||
      name.includes('tung') || name.includes('тунг') ||
      name.includes('hemp') || name.includes('коноп') ||
      name.includes('safflower') || name.includes('шафлор') ||
      name.includes('oil') && !name.includes('mineral')
    );
  }

  /** Получает температуру кипения сущности (°C). */
  private static getBoilingPoint(entity: IChemicalEntity): number {
    // Пробуем получить через различные методы
    const vp50 = entity.getVaporPressure(50);
    if (vp50 <= 0) return 0;
    // Приблизительная точка кипения: где P = 760 mmHg
    // Используем бинарный поиск
    let low = -50, high = 300;
    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      const vp = entity.getVaporPressure(mid);
      if (vp < 760) low = mid; else high = mid;
    }
    return (low + high) / 2;
  }

  /** Рассчитывает время испарения растворителей. */
  private static calculateEvaporationTime(
    volatileComponents: MixtureComponent[],
    volatileMass: number,
    temperatureCelsius: number
  ): number {
    if (volatileMass <= 0) return 0;

    let totalRate = 0;
    for (const c of volatileComponents) {
      const mass = c.moles * c.entity.getMass();
      const bp = this.getBoilingPoint(c.entity);
      if (bp <= 0) continue;

      // Скорость испарения пропорциональна давлению пара и обратно температуре кипения
      const vaporPressure = c.entity.getVaporPressure(temperatureCelsius);
      const rate = (vaporPressure / 760) * (100 / Math.max(bp, 50)) * EVAPORATION_FACTOR;
      totalRate += rate * (mass / volatileMass);
    }

    // Базовое время: 30 минут для 100% летучих при 25°C
    const baseTime = 30;
    const tempFactor = Math.pow(1.08, temperatureCelsius - 25); // +8% скорости на каждый °C
    return (baseTime / Math.max(totalRate, 0.01)) / tempFactor;
  }

  /** Рассчитывает время окислительной полимеризации масел. */
  private static calculatePolymerizationTime(
    oilComponents: MixtureComponent[],
    totalMass: number,
    temperatureCelsius: number
  ): number {
    if (oilComponents.length === 0) return 0;

    const oilMass = oilComponents.reduce((s, c) => s + c.moles * c.entity.getMass(), 0);
    const oilFraction = oilMass / totalMass;

    // Йодное число: чем выше, тем быстрее полимеризация
    // Льняное масло ~170-200, тунговое ~160-170, подсолнечное ~120-140
    let avgIodineValue = 0;
    let totalOilMass = 0;
    for (const c of oilComponents) {
      const name = c.entity.getName().toLowerCase();
      let iv = 120; // default
      if (name.includes('linseed') || name.includes('льнян')) iv = 180;
      else if (name.includes('tung') || name.includes('тунг')) iv = 165;
      else if (name.includes('hemp') || name.includes('коноп')) iv = 160;
      else if (name.includes('safflower') || name.includes('шафлор')) iv = 140;

      const mass = c.moles * c.entity.getMass();
      avgIodineValue += iv * mass;
      totalOilMass += mass;
    }
    avgIodineValue = totalOilMass > 0 ? avgIodineValue / totalOilMass : 120;

    // Время полимеризации: пропорционально йодному числу и обратной температуре
    const basePolymerization = 480; // 8 часов при 25°C для IV=150
    const ivFactor = basePolymerization / (avgIodineValue * OXIDATION_RATE);
    const tempFactor = Math.pow(0.92, temperatureCelsius - 25); // медленнее при низкой T
    const oilFactor = 1 / Math.max(oilFraction, 0.1); // больше масла — дольше

    return ivFactor * tempFactor * oilFactor;
  }

  /** Формирует стадии высыхания. */
  private static buildStages(
    evaporationTime: number,
    polymerizationTime: number,
    mechanism: string
  ): IDryingStage[] {
    const stages: IDryingStage[] = [];
    const total = Math.max(evaporationTime, polymerizationTime);
    if (total <= 0) return stages;

    if (mechanism === 'evaporation' || mechanism === 'hybrid') {
      stages.push({
        name: 'Испарение растворителя',
        description: 'Удаление летучих компонентов',
        durationMin: Math.round(evaporationTime * 0.6),
        percentComplete: 60
      });
      stages.push({
        name: 'Формирование плёнки',
        description: 'Начало структурирования покрытия',
        durationMin: Math.round(evaporationTime * 0.4),
        percentComplete: 85
      });
    }

    if (mechanism === 'oxidation' || mechanism === 'hybrid') {
      stages.push({
        name: 'Окислительная полимеризация',
        description: 'Сшивание молекул масла кислородом воздуха',
        durationMin: Math.round(polymerizationTime * 0.5),
        percentComplete: 50
      });
      stages.push({
        name: 'Финальная полимеризация',
        description: 'Достижение полной твёрдости',
        durationMin: Math.round(polymerizationTime * 0.5),
        percentComplete: 100
      });
    }

    return stages.sort((a, b) => a.percentComplete - b.percentComplete);
  }

  /** Формирует рекомендации. */
  private static buildRecommendations(
    mechanism: string,
    volatilePercent: number,
    touchDryTimeMin: number
  ): string[] {
    const recs: string[] = [];

    if (mechanism === 'evaporation') {
      recs.push('Высыхание за счёт испарения. Ускорьте вентиляцией или нагревом');
    } else if (mechanism === 'oxidation') {
      recs.push('Высыхание за счёт окисления. Обеспечьте доступ воздуха, избегайте герметичной упаковки');
    } else {
      recs.push('Гибридный механизм: испарение + окисление. Контролируйте оба процесса');
    }

    if (volatilePercent > 50) {
      recs.push('Высокое содержание растворителя — покрытие может дать усадку и трещины');
    }

    if (touchDryTimeMin > 60) {
      recs.push('Долгое высыхание. Рассмотрите добавление сиккативов (ускорителей)');
    } else if (touchDryTimeMin < 5) {
      recs.push('Слишком быстрое высыхание — может привести к дефектам плёнки');
    }

    return recs;
  }

  private static getTotalMass(components: MixtureComponent[]): number {
    return components.reduce((sum, c) => sum + c.moles * c.entity.getMass(), 0);
  }
}
