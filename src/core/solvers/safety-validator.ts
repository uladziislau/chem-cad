import { MultiphaseSystem } from '../entities/multiphase-system';
import { Surfactant } from '../entities/surfactant';
import { IonicSolver } from './ionic-solver';
import { MixtureComponent } from '../entities/mixture';

export type SafetyLevel = 'info' | 'warning' | 'error' | 'critical';

export interface ISafetyIssue {
  level: SafetyLevel;
  title: string;
  message: string;
  code: string;
}

export class SafetyValidator {
  /**
   * Проверяет систему на химическую совместимость и безопасность.
   */
  public static validate(system: MultiphaseSystem, currentPH: number): ISafetyIssue[] {
    const issues: ISafetyIssue[] = [];
    const components = system.getGlobalComposition().getComponents();

    // 1. Проверка конфликта ПАВ (Анионные + Катионные)
    const hasAnionic = components.some((c: MixtureComponent) => c.entity instanceof Surfactant && c.entity.getIonicCharge() === -1);
    const hasCationic = components.some((c: MixtureComponent) => c.entity instanceof Surfactant && c.entity.getIonicCharge() === 1);

    if (hasAnionic && hasCationic) {
      issues.push({
        level: 'error',
        title: 'Конфликт ПАВ',
        message: 'Смешивание анионных и катионных ПАВ приводит к образованию нерастворимого комплекса (осадка). Система будет нестабильна.',
        code: 'SURF_CHARGE_CONFLICT'
      });
    }

    // 2. Проверка нейтрализации (Кислота + Щелочь)
    const totalMoles = components.reduce((sum: number, c: MixtureComponent) => sum + c.moles, 0);
    const hasStrongAcid = components.some((c: MixtureComponent) => {
      const pKas = c.entity.getPKas();
      return pKas !== undefined && pKas.some(pKa => pKa < 4) && (c.moles / totalMoles) > 0.01;
    });
    const hasStrongBase = components.some((c: MixtureComponent) => {
      const pKas = c.entity.getPKas();
      return pKas !== undefined && pKas.some(pKa => pKa > 10) && (c.moles / totalMoles) > 0.01;
    });

    if (hasStrongAcid && hasStrongBase) {
      issues.push({
        level: 'warning',
        title: 'Реакция нейтрализации',
        message: 'В системе присутствуют и кислота, и щелочь в значимых концентрациях. Это приведет к их взаимной нейтрализации, выделению тепла и потере эффективности активных компонентов.',
        code: 'ACID_BASE_NEUTRALIZATION'
      });
    }

    // 3. Экстремальный pH
    if (currentPH < 2) {
      issues.push({
        level: 'critical',
        title: 'Опасно низкий pH',
        message: 'Продукт является сильнокислотным (pH < 2). Высокий риск химического ожога кожи и повреждения поверхностей. Требуются специальные средства защиты.',
        code: 'EXTREME_ACIDITY'
      });
    } else if (currentPH > 12) {
      issues.push({
        level: 'critical',
        title: 'Опасно высокий pH',
        message: 'Продукт является сильнощелочным (pH > 12). Высокий риск химического ожога и коррозии. Избегайте контакта с кожей и алюминием.',
        code: 'EXTREME_ALKALINITY'
      });
    }

    // 4. Ионная сила и загустители
    const ionicStrength = IonicSolver.calculateIonicStrength(system);
    const hasXanthan = components.some((c: MixtureComponent) => c.entity.getName().toLowerCase().includes('xanthan'));
    
    if (hasXanthan && ionicStrength > 0.5) {
      issues.push({
        level: 'warning',
        title: 'Деградация вязкости',
        message: 'Высокая ионная сила (соли) подавляет гидратацию ксантановой камеди. Вязкость системы может быть значительно ниже расчетной.',
        code: 'IONIC_THICKENER_DEGRADATION'
      });
    }

    return issues;
  }
}
