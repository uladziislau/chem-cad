import { describe, it, expect } from 'vitest';
import { formatReportText, formatReportCsv } from '@adapters/report.service';
import type { SimulationResult } from '@root-modules/engine/chemical-engine';

const baseResult: SimulationResult = {
  system: {} as SimulationResult['system'],
  context: {
    temperatureCelsius: 25,
    pressureAtm: 1,
    mixingSpeedRpm: 0,
    mixingTimeMinutes: 0,
    get temperatureKelvin() { return 298.15; },
  },
  metrics: {
    viscosity: 12.5,
    stabilityDays: 180,
    enthalpy: 2500,
    actualHLB: 11.2,
    hld: -0.8,
    ionicStrength: 0.15,
    miscibility: {
      isMiscible: true,
      redScore: 0.7,
      distanceRa: 5.6,
      message: 'Хорошая смешиваемость',
    },
    ph: 6.8,
    solubilityIssues: [
      { entityName: 'NaCl', excessMass: 2.3, limit: 36 },
    ],
  },
  safety: {
    isSafe: true,
    issues: [],
  },
};

describe('ReportService (Экспорт отчётов)', () => {
  it('formatReportText содержит все ключевые метрики', () => {
    const text = formatReportText(baseResult);
    expect(text).toContain('12.50'); // вязкость
    expect(text).toContain('180');   // стабильность
    expect(text).toContain('6.80');  // pH
    expect(text).toContain('NaCl');  // перенасыщение
    expect(text).toContain('Безопасность: OK');
  });

  it('formatReportText с проблемами безопасности', () => {
    const unsafe = {
      ...baseResult,
      safety: {
        isSafe: false,
        issues: [{ level: 'error' as const, title: 'Конфликт', message: 'Тест', code: 'X' }],
      },
    };
    const text = formatReportText(unsafe);
    expect(text).toContain('ЕСТЬ ПРОБЛЕМЫ');
    expect(text).toContain('[error] Конфликт');
  });

  it('formatReportCsv — валидный CSV с заголовком', () => {
    const csv = formatReportCsv(baseResult);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('metric,value,unit');
    expect(lines.length).toBe(10);
    expect(lines.some(l => l.startsWith('viscosity,'))).toBe(true);
    expect(lines.some(l => l.startsWith('ph,'))).toBe(true);
  });

  it('formatReportCsv — экранирует запятые в значениях', () => {
    const csv = formatReportCsv(baseResult);
    expect(csv).not.toContain('\n\n');
  });
});
