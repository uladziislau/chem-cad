import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';

/**
 * Панель оценки моющей способности (DetergencySolver).
 */
@Component({
  selector: 'app-detergency-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (report(); as r) {
      <div class="p-4 rounded-2xl border border-white/10 bg-slate-900/50">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Моющая способность</span>
          </div>
          <div class="text-lg font-mono font-bold"
               [class.text-emerald-400]="r.score >= 70"
               [class.text-amber-400]="r.score >= 40 && r.score < 70"
               [class.text-rose-400]="r.score < 40">
            {{ r.score }}
          </div>
        </div>

        <!-- Score bars -->
        <div class="space-y-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-500 w-16">Жир</span>
            <div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all"
                   [class.bg-emerald-500]="r.degreasing >= 70"
                   [class.bg-amber-500]="r.degreasing >= 40 && r.degreasing < 70"
                   [class.bg-rose-500]="r.degreasing < 40"
                   [style.width.%]="r.degreasing"></div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 w-8 text-right">{{ r.degreasing }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-500 w-16">Налёт</span>
            <div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all"
                   [class.bg-emerald-500]="r.descaling >= 70"
                   [class.bg-amber-500]="r.descaling >= 40 && r.descaling < 70"
                   [class.bg-rose-500]="r.descaling < 40"
                   [style.width.%]="r.descaling"></div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 w-8 text-right">{{ r.descaling }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-500 w-16">ПАВ</span>
            <div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all"
                   [class.bg-emerald-500]="r.surfactantPower >= 70"
                   [class.bg-amber-500]="r.surfactantPower >= 40 && r.surfactantPower < 70"
                   [class.bg-rose-500]="r.surfactantPower < 40"
                   [style.width.%]="r.surfactantPower"></div>
            </div>
            <span class="text-[10px] font-mono text-slate-400 w-8 text-right">{{ r.surfactantPower }}</span>
          </div>
        </div>

        <!-- Factors -->
        <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-500 mb-3">
          <div>pH: <span class="text-slate-300 font-mono">{{ r.factors.pH | number:'1.1-1' }}</span></div>
          <div>Ионная сила: <span class="text-slate-300 font-mono">{{ r.factors.ionicStrength | number:'1.2-2' }} M</span></div>
          <div>ПАВ: <span class="text-slate-300 font-mono">{{ r.factors.surfactantPercent | number:'1.1-1' }}%</span></div>
          <div>HLB: <span class="text-slate-300 font-mono">{{ r.factors.hlbBalance | number:'1.2-2' }}</span></div>
        </div>

        <!-- Recommendations -->
        @if (r.recommendations.length > 0) {
          <div class="pt-2 border-t border-white/5 space-y-1">
            @for (rec of r.recommendations; track rec) {
              <div class="text-[10px] text-slate-400 flex items-start gap-1.5">
                <span class="text-indigo-400 mt-0.5">→</span>
                <span>{{ rec }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class DetergencyPanelComponent {
  private state = inject(FormulationStateService);
  readonly report = this.state.detergentReport;
}
