import { Injectable, inject } from '@angular/core';
import { CatalogService, ICatalogIngredient } from './catalog.service';
import { FormulationStateService } from './formulation-state.service';
import { downloadText } from '@adapters/report.service';

/**
 * Генератор паспорта безопасности (SDS) по ГОСТ 30333 / GHS.
 * Упрощённая 16-секционная структура для учебных/домашних рецептур.
 */
@Injectable({ providedIn: 'root' })
export class SdsService {
  private catalog = inject(CatalogService);
  private state = inject(FormulationStateService);

  /** Сформировать текст SDS для текущей рецептуры. */
  generateSds(): string {
    const items = this.state.items();
    const totalMass = this.state.totalMass();
    const now = new Date().toLocaleDateString('ru-RU');

    const ingredients = items.map(item => {
      const pct = totalMass > 0 ? (item.massGrams / totalMass) * 100 : 0;
      return { ...item.ingredient, massGrams: item.massGrams, percent: pct };
    });

    const hazardous = ingredients.filter(i => this.isHazardous(i));
    const ghsCodes = this.collectGhsCodes(ingredients);

    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '  ПАСПОРТ БЕЗОПАСНОСТИ ХИМИЧЕСКОЙ ПРОДУКЦИИ (SDS)',
      '  Формат: ГОСТ 30333-95 / GHS Rev.9 (упрощённый)',
      '═══════════════════════════════════════════════════════════════',
      '',
      '1. ИДЕНТИФИКАЦИЯ ПРОДУКТА',
      '───────────────────────────────────────────────────────────────',
      `  Название:        Химическая рецептура (chem-cad)`,
      `  Дата составления: ${now}`,
      `  Общая масса:     ${totalMass.toFixed(1)} г`,
      `  pH:              ${this.state.simulationResult()?.metrics.ph.toFixed(2) ?? 'N/A'}`,
      '',
      '2. ИДЕНТИФИКАЦИЯ ОПАСНОСТЕЙ',
      '───────────────────────────────────────────────────────────────',
      `  Сигнальное слово: ${hazardous.length > 0 ? 'ОПАСНО' : 'ОСТОРОЖНО'}`,
      `  Коды GHS:        ${ghsCodes.length > 0 ? ghsCodes.join(', ') : 'Нет'}`,
      `  Опасные компоненты: ${hazardous.length} из ${ingredients.length}`,
      '',
      '3. СОСТАВ / ИНФОРМАЦИЯ О КОМПОНЕНТАХ',
      '───────────────────────────────────────────────────────────────',
      '  Компонент                    | CAS/INCI          | %     | GHS',
      '  ─────────────────────────────────────────────────────────────',
      ...ingredients.map(i =>
        `  ${i.name.padEnd(28)} | ${i.inci.padEnd(16)} | ${i.percent.toFixed(1).padStart(5)} | ${this.getGhsFor(i).join(',') || '-'}`
      ),
      '',
      '4. МЕРЫ ПЕРВОЙ ПОМОЩИ',
      '───────────────────────────────────────────────────────────────',
      '  При вдыхании:  Вынести на свежий воздух, обеспечить тепло и покой.',
      '  При попадании на кожу: Промыть большим количеством воды с мылом.',
      '  При попадании в глаза: Промыть большим количеством воды 10–15 минут.',
      '  При проглатывании: НЕ вызывать рвоту. Дать выпить 200–300 мл воды.',
      '',
      '5. МЕРЫ ПОЖАРОТУШЕНИЯ',
      '───────────────────────────────────────────────────────────────',
      '  Средства пожаротушения: Вода, пена, порошок CO₂.',
      '  Особые опасности: Избегать вдыхания паров при нагревании.',
      '',
      '6. МЕРЫ ПРИ СЛУЧАЙНОМ ВЫСЫПАНИИ',
      '───────────────────────────────────────────────────────────────',
      '  Собрать в отдельную ёмкость. Не допускать попадания в канализацию.',
      '  Проветрить помещение. Использовать СИЗ (перчатки, очки).',
      '',
      '7. ОБРАЩЕНИЕ И ХРАНЕНИЕ',
      '───────────────────────────────────────────────────────────────',
      '  Хранить в плотно закрытой таре при температуре 15–25 °C.',
      '  Избегать прямых солнечных лучей и нагрева.',
      '',
      '8. КОНТРОЛЬ ВОЗДЕЙСТВИЯ / СИЗ',
      '───────────────────────────────────────────────────────────────',
      '  Перчатки: нитриловые или латексные',
      '  Очки: защитные с боковыми щитками',
      '  Респиратор: при работе с пылью/аэрозолем',
      '',
      '9. ФИЗИЧЕСКИЕ И ХИМИЧЕСКИЕ СВОЙСТВА',
      '───────────────────────────────────────────────────────────────',
      `  Вязкость:       ${this.state.simulationResult()?.metrics.viscosity.toFixed(2) ?? 'N/A'} cP`,
      `  Стабильность:   ${this.state.simulationResult()?.metrics.stabilityDays.toFixed(0) ?? 'N/A'} дней`,
      `  Ионная сила:    ${this.state.simulationResult()?.metrics.ionicStrength.toFixed(3) ?? 'N/A'} М`,
      `  HLB:            ${this.state.simulationResult()?.metrics.actualHLB.toFixed(1) ?? 'N/A'}`,
      '',
      '10. СТАБИЛЬНОСТЬ И РЕАКЦИОННАЯ СПОСОБНОСТЬ',
      '───────────────────────────────────────────────────────────────',
      '  Стабильна при нормальных условиях. Не смешивать с сильными кислотами/щелочами.',
      '',
      '11. ТОКСИКОЛОГИЧЕСКАЯ ИНФОРМАЦИЯ',
      '───────────────────────────────────────────────────────────────',
      '  При правильном применении риск минимален. Избегать попадания в глаза.',
      '',
      '12. ЭКОЛОГИЧЕСКАЯ ИНФОРМАЦИЯ',
      '───────────────────────────────────────────────────────────────',
      '  Не допускать попадания в водоёмы. Утилизировать как бытовые отходы.',
      '',
      '13. УТИЛИЗАЦИЯ',
      '───────────────────────────────────────────────────────────────',
      '  Утилизировать в соответствии с местным законодательством.',
      '',
      '14. ТРАНСПОРТНАЯ ИНФОРМАЦИЯ',
      '───────────────────────────────────────────────────────────────',
      '  Не является опасным грузом при соблюдении правил перевозки.',
      '',
      '15. РЕГУЛИРУЮЩАЯ ИНФОРМАЦИЯ',
      '───────────────────────────────────────────────────────────────',
      '  Не подлежит обязательной маркировке GHS (упрощённая рецептура).',
      '  Для промышленного применения требуется полный SDS.',
      '',
      '16. ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ',
      '───────────────────────────────────────────────────────────────',
      '  Документ сгенерирован автоматически системой chem-cad.',
      '  Не заменяет профессиональную оценку безопасности.',
      '',
      '═══════════════════════════════════════════════════════════════',
      `  Сгенерировано: ${new Date().toISOString()}`,
      '═══════════════════════════════════════════════════════════════'
    ];

    return lines.join('\n');
  }

  /** Скачать SDS как .txt файл. */
  downloadSds(): void {
    const sds = this.generateSds();
    const filename = `SDS_${new Date().toISOString().slice(0, 10)}.txt`;
    downloadText(filename, sds, 'text/plain');
  }

  /** Проверить, является ли ингредиент опасным. */
  private isHazardous(ing: ICatalogIngredient & { percent: number }): boolean {
    if (ing.safetyLevel === 'danger' || ing.safetyLevel === 'hazardous') return true;
    if (ing.safetyLevel === 'caution') return ing.percent > 5;
    // Fallback для ингредиентов без явного уровня
    const name = ing.name.toLowerCase();
    const category = ing.category;
    return (
      category === 'active' && (name.includes('натрия') || name.includes('гидроксид') || name.includes('кислот')) ||
      name.includes('спирт') ||
      name.includes('isoprop') ||
      (category === 'surfactant' && ing.percent > 20)
    );
  }

  /** GHS-эвристики по ключевым словам в названии. */
  private static readonly GHS_RULES: { pattern: RegExp; codes: string[] }[] = [
    { pattern: /натрия гидроксид|гидроксид/, codes: ['H314'] },
    { pattern: /кислот/, codes: ['H315', 'H319'] },
    { pattern: /спирт|isoprop/, codes: ['H225', 'H319'] },
    { pattern: /sls|лаурет|кокосульфат/, codes: ['H315', 'H319'] },
    { pattern: /хлорид/, codes: ['H315', 'H319'] }
  ];

  /** Получить GHS-коды для ингредиента — сначала из каталога, потом эвристика. */
  private getGhsFor(ing: ICatalogIngredient & { percent: number }): string[] {
    if (ing.ghsCodes && ing.ghsCodes.length > 0) return ing.ghsCodes;
    const name = ing.name.toLowerCase();
    const codes = new Set<string>();
    for (const rule of SdsService.GHS_RULES) {
      if (rule.pattern.test(name)) rule.codes.forEach(c => codes.add(c));
    }
    return Array.from(codes);
  }

  /** Собрать все уникальные GHS-коды. */
  private collectGhsCodes(ingredients: (ICatalogIngredient & { percent: number })[]): string[] {
    const codes = new Set<string>();
    for (const ing of ingredients) {
      for (const code of this.getGhsFor(ing)) codes.add(code);
    }
    return Array.from(codes).sort();
  }
}
