import { Injectable, inject } from '@angular/core';
import { FormulationStateService, FormulationItem } from './formulation-state.service';
import { SimulationResult } from '@root-modules/engine/chemical-engine';
import { downloadText } from '@adapters/report.service';

/**
 * Генератор печатного отчёта по рецептуре (HTML → print → PDF).
 * Не требует внешних PDF-библиотек: браузер сам сохраняет в PDF.
 */
@Injectable({ providedIn: 'root' })
export class FormulationReportService {
  private state = inject(FormulationStateService);

  /** Открыть окно печати с отчётом. Возвращает false, если рецептура пуста. */
  printReport(): boolean {
    const html = this.buildHtml();
    if (!html) return false;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return false;
    win.document.write(html);
    win.document.close();
    win.focus();
    // Небольшая задержка, чтобы DOM успел отрендериться
    setTimeout(() => win.print(), 300);
    return true;
  }

  /** Скачать отчёт как HTML-файл. */
  downloadHtml(): boolean {
    const html = this.buildHtml();
    if (!html) return false;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`formulation-report-${stamp}.html`, html, 'text/html');
    return true;
  }

  private buildHtml(): string | null {
    const items = this.state.items();
    const total = this.state.totalMass();
    const result = this.state.report();
    if (items.length === 0 || total <= 0) return null;

    const now = new Date().toLocaleString('ru-RU');
    const temp = this.state.targetTemperature();
    const rpm = this.state.mixerRpm();
    const mixMin = this.state.mixingTimeMinutes();

    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Отчёт по рецептуре — ${now}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 24px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 2px solid #333; padding-bottom: 4px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f0f0f0; font-weight: 600; }
  .num { text-align: right; font-family: 'Consolas', monospace; }
  .pct { text-align: right; font-family: 'Consolas', monospace; width: 60px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { border: 1px solid #ddd; border-radius: 6px; padding: 10px; }
  .card .label { font-size: 10px; text-transform: uppercase; color: #888; font-weight: 600; }
  .card .value { font-size: 16px; font-weight: 700; font-family: 'Consolas', monospace; }
  .warn { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 8px; margin: 4px 0; font-size: 11px; }
  .danger { background: #f8d7da; border-color: #dc3545; }
  .ok { background: #d4edda; border-color: #28a745; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 10px; color: #888; }
  @media print { body { padding: 0; } .no-print { display: none; } }
  .no-print { margin-bottom: 16px; }
  .no-print button { padding: 8px 16px; font-size: 12px; cursor: pointer; }
</style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">🖨 Печать / Сохранить PDF</button>
  <button onclick="window.close()" style="margin-left:8px">Закрыть</button>
</div>

<h1>Отчёт по рецептуре</h1>
<div class="meta">
  Дата: ${now} &nbsp;|&nbsp; Температура: ${temp}°C &nbsp;|&nbsp; Гомогенизатор: ${rpm} RPM, ${mixMin} мин &nbsp;|&nbsp; Масса: ${total.toFixed(1)} г
</div>

<h2>Состав</h2>
<table>
  <tr><th>#</th><th>Ингредиент</th><th>INCI</th><th>Категория</th><th class="num">Масса, г</th><th class="pct">%</th><th class="num">Цена/кг</th></tr>
  ${items.map((item, i) => this.rowHtml(item, i, total)).join('\n  ')}
  <tr style="font-weight:700;background:#f5f5f5">
    <td colspan="4">Итого</td>
    <td class="num">${total.toFixed(2)}</td>
    <td class="pct">100.0</td>
    <td class="num">\$${this.state.totalCostPerKg().toFixed(2)}</td>
  </tr>
</table>

<h2>Физико-химические показатели</h2>
<div class="grid">
  ${this.metricCard('Вязкость', result ? `${result.metrics.viscosity.toFixed(2)} cP` : '—')}
  ${this.metricCard('Стабильность', result ? (result.metrics.stabilityDays > 700 ? '> 2 лет' : `${result.metrics.stabilityDays.toFixed(0)} дней`) : '—')}
  ${this.metricCard('pH', result ? result.metrics.ph.toFixed(2) : '—')}
  ${this.metricCard('Ионная сила', result ? `${result.metrics.ionicStrength.toFixed(3)} M` : '—')}
  ${this.metricCard('HLB факт', result ? result.metrics.actualHLB.toFixed(2) : '—')}
  ${this.metricCard('HLD', result ? result.metrics.hld.toFixed(2) : '—')}
  ${this.metricCard('Энтальпия', result ? `${(result.metrics.enthalpy / 1000).toFixed(2)} кДж` : '—')}
  ${this.metricCard('Эмульсия', result ? result.system.getEmulsionType() : '—')}
</div>

${this.safetySection(result)}
${this.solverSection()}

<div class="footer">
  ChemCAD Laboratory — автоматический отчёт. Данные расчёта носят справочный характер.
</div>

</body>
</html>`;
  }

  private rowHtml(item: FormulationItem, index: number, total: number): string {
    const ing = item.ingredient;
    const pct = total > 0 ? (item.massGrams / total) * 100 : 0;
    const catColors: Record<string, string> = {
      water: '#e3f2fd', oil: '#fff8e1', surfactant: '#e8f5e9',
      thickener: '#f3e5f5', active: '#fce4ec', solvent: '#e0f7fa', pigment: '#fbe9e7'
    };
    const bg = catColors[ing.category] ?? '#f5f5f5';
    return `<tr>
      <td>${index + 1}</td>
      <td>${this.esc(ing.name)}</td>
      <td style="font-family:monospace;font-size:10px">${this.esc(ing.inci)}</td>
      <td><span style="background:${bg};padding:2px 6px;border-radius:3px;font-size:10px">${ing.category}</span></td>
      <td class="num">${item.massGrams.toFixed(2)}</td>
      <td class="pct">${pct.toFixed(1)}</td>
      <td class="num">\$${ing.pricePerKg.toFixed(2)}</td>
    </tr>`;
  }

  private metricCard(label: string, value: string): string {
    return `<div class="card">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>`;
  }

  private safetySection(result: SimulationResult | null): string {
    if (!result) return '';
    const issues = result.safety.issues;
    if (issues.length === 0) {
      return `<h2>Безопасность</h2><div class="warn ok">✓ Замечаний по безопасности нет</div>`;
    }
    const rows = issues.map(i =>
      `<div class="warn ${i.level === 'critical' || i.level === 'error' ? 'danger' : ''}">
        <strong>[${i.level.toUpperCase()}]</strong> ${this.esc(i.title)}: ${this.esc(i.message)}
      </div>`
    ).join('\n  ');
    return `<h2>Безопасность (${issues.length} замечаний)</h2>\n  ${rows}`;
  }

  private solverSection(): string {
    const det = this.state.detergentReport();
    const dry = this.state.dryingReport();
    if (!det && !dry) return '';

    let html = '<h2>Анализ свойств</h2><div class="grid">';

    if (det) {
      html += this.metricCard('Моющая способность', `${det.score.toFixed(0)}/100`);
      html += this.metricCard('Обезжиривание', `${det.degreasing.toFixed(0)}%`);
      html += this.metricCard('Удаление налёта', `${det.descaling.toFixed(0)}%`);
      html += this.metricCard('Поверхностно-активные', `${det.surfactantPower.toFixed(0)}%`);
    }
    if (dry) {
      html += this.metricCard('Высыхание на отлип', `${dry.touchDryTimeMin.toFixed(0)} мин`);
      html += this.metricCard('Полная полимеризация', `${dry.fullDryTimeMin.toFixed(0)} мин`);
      html += this.metricCard('Летучие', `${dry.volatilePercent.toFixed(1)}%`);
      html += this.metricCard('Механизм', dry.mechanism);
    }

    html += '</div>';

    const recs: string[] = [];
    if (det?.recommendations) recs.push(...det.recommendations.map(r => `🧪 ${r}`));
    if (dry?.recommendations) recs.push(...dry.recommendations.map(r => `💨 ${r}`));
    if (recs.length > 0) {
      html += `<h3 style="margin:12px 0 6px;font-size:12px">Рекомендации</h3><ul style="padding-left:18px">${recs.map(r => `<li style="margin:2px 0">${this.esc(r)}</li>`).join('')}</ul>`;
    }

    return html;
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
