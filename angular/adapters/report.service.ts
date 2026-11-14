import { SimulationResult } from '@root-modules/engine/chemical-engine';

/**
 * Формирует текстовый отчёт по результатам симуляции (для UI и буфера обмена).
 */
export function formatReportText(result: SimulationResult): string {
  const { metrics, safety } = result;
  const lines: string[] = [
    '═══ ОТЧЁТ ПО РАСЧЁТУ ═══',
    '',
    `Температура:      ${result.context.temperatureCelsius.toFixed(1)} °C`,
    `Давление:         ${result.context.pressureAtm.toFixed(2)} атм`,
    '',
    '── Метрики ──',
    `Вязкость:         ${metrics.viscosity.toFixed(2)} cP`,
    `Стабильность:     ${metrics.stabilityDays.toFixed(0)} дней`,
    `Энтальпия:        ${(metrics.enthalpy / 1000).toFixed(2)} кДж`,
    `HLB факт/треб:   ${metrics.actualHLB.toFixed(1)} / ${metrics.hld.toFixed(1)}`,
    `Ионная сила:      ${metrics.ionicStrength.toFixed(3)} М`,
    `pH:               ${metrics.ph.toFixed(2)}`,
  ];

  if (metrics.miscibility) {
    lines.push(
      `Смешиваемость:   ${metrics.miscibility.isMiscible ? 'да' : 'нет'} (RED=${metrics.miscibility.redScore.toFixed(2)})`
    );
  }

  if (metrics.solubilityIssues.length > 0) {
    lines.push('', '── Перенасыщение ──');
    for (const issue of metrics.solubilityIssues) {
      lines.push(`  ⚠ ${issue.entityName}: +${issue.excessMass.toFixed(2)} г сверх лимита`);
    }
  }

  lines.push('', `── Безопасность: ${safety.isSafe ? 'OK' : 'ЕСТЬ ПРОБЛЕМЫ'} ──`);
  for (const issue of safety.issues) {
    lines.push(`  [${issue.level}] ${issue.title}: ${issue.message}`);
  }

  return lines.join('\n');
}

/**
 * Экспорт в CSV: одна строка метрик.
 */
export function formatReportCsv(result: SimulationResult): string {
  const m = result.metrics;
  const header = 'metric,value,unit';
  const rows = [
    `viscosity,${m.viscosity.toFixed(3)},cP`,
    `stability_days,${m.stabilityDays.toFixed(1)},days`,
    `enthalpy_kJ,${(m.enthalpy / 1000).toFixed(3)},kJ`,
    `hlb_actual,${m.actualHLB.toFixed(3)},-`,
    `hld,${m.hld.toFixed(3)},-`,
    `ionic_strength,${m.ionicStrength.toFixed(5)},M`,
    `ph,${m.ph.toFixed(3)},-`,
    `safe,${result.safety.isSafe},-`,
    `issues_count,${result.safety.issues.length},-`,
  ];
  return [header, ...rows].join('\n');
}

/**
 * Скачивание текста как файла в браузере.
 */
export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
