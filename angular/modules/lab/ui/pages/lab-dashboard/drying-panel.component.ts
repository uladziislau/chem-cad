import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';

/**
 * Панель оценки времени высыхания (DryingSolver).
 */
@Component({
  selector: 'app-drying-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (report(); as r) {
      <div class="p-4 rounded-2xl border border-white/10 bg-slate-900/50">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Высыхание</span>
          </div>
          <div class="text-xs font-mono text-slate-400">
            {{ r.mechanism === 'evaporation' ? 'Испарение' : r.mechanism === 'oxidation' ? 'Окисление' : 'Гибрид' }}
          </div>
        </div>

        <!-- Time display -->
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-center">
            <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Сухой на отлип</div>
            <div class="text-lg font-mono font-bold text-amber-400">{{ formatTime(r.touchDryTimeMin) }}</div>
          </div>
          <div class="bg-slate-950/50 p-3 rounded-xl border border-white/5 text-center">
            <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Полное высыхание</div>
            <div class="text-lg font-mono font-bold text-orange-400">{{ formatTime(r.fullDryTimeMin) }}</div>
          </div>
        </div>

        <!-- Stages -->
        @if (r.stages.length > 0) {
          <div class="space-y-2 mb-3">
            <div class="text-[10px] text-slate-500 uppercase font-bold">Стадии</div>
            @for (stage of r.stages; track stage.name) {
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <div class="flex justify-between text-[10px] mb-0.5">
                    <span class="text-slate-300">{{ stage.name }}</span>
                    <span class="text-slate-500 font-mono">{{ formatTime(stage.durationMin) }}</span>
                  </div>
                  <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500/60 rounded-full" [style.width.%]="stage.percentComplete"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Volatile content -->
        <div class="flex justify-between text-[10px] text-slate-500 mb-3">
          <span>Летучие компоненты</span>
          <span class="font-mono text-slate-300">{{ r.volatilePercent }}%</span>
        </div>

        <!-- Recommendations -->
        @if (r.recommendations.length > 0) {
          <div class="pt-2 border-t border-white/5 space-y-1">
            @for (rec of r.recommendations; track rec) {
              <div class="text-[10px] text-slate-400 flex items-start gap-1.5">
                <span class="text-amber-400 mt-0.5">→</span>
                <span>{{ rec }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class DryingPanelComponent {
  private state = inject(FormulationStateService);
  readonly report = this.state.dryingReport;

  formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
  }
}
