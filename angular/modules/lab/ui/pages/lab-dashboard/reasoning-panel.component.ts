import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstrumentariyService, GatewayStatus, ToolResult } from '@adapters/instrumentariy.service';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';

/**
 * Панель интеграции с instrumentariy reasoning engine.
 * Позволяет запускать reasoning-задачи прямо из lab-dashboard.
 */
@Component({
  selector: 'app-reasoning-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 rounded-2xl border border-white/10 bg-slate-900/50">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Reasoning Engine</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full"
                [class.bg-emerald-400]="status() === 'connected'"
                [class.bg-amber-400]="status() === 'unknown'"
                [class.bg-rose-400]="status() === 'disconnected' || status() === 'error'"></span>
          <span class="text-[10px] text-slate-500">{{ status() }}</span>
        </div>
      </div>

      <!-- Task Input -->
      <div class="space-y-2">
        <textarea
          [(ngModel)]="taskInput"
          placeholder="Опишите задачу для reasoning engine..."
          class="w-full h-16 px-3 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none resize-none"
        ></textarea>

        <div class="flex gap-2">
          <button (click)="runComplexity()"
                  [disabled]="!taskInput.trim() || loading()"
                  class="flex-1 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:opacity-40 text-indigo-300 text-xs font-bold rounded-lg transition-colors border border-indigo-500/20">
            Сложность
          </button>
          <button (click)="runThink()"
                  [disabled]="!taskInput.trim() || loading()"
                  class="flex-1 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-40 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-white/10">
            Think (L0)
          </button>
          <button (click)="checkConnection()"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition-colors border border-white/5">
            Ping
          </button>
        </div>
      </div>

      <!-- Result -->
      @if (result(); as res) {
        <div class="mt-3 p-3 rounded-xl border"
             [class.bg-emerald-950/30]="res.success"
             [class.border-emerald-500/20]="res.success"
             [class.bg-rose-950/30]="!res.success"
             [class.border-rose-500/20]="!res.success">
          <div class="text-[10px] uppercase font-bold mb-1"
               [class.text-emerald-400]="res.success"
               [class.text-rose-400]="!res.success">
            {{ res.success ? 'Результат' : 'Ошибка' }}
          </div>
          <pre class="text-[10px] text-slate-300 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{{ formatResult(res) }}</pre>
        </div>
      }

      @if (loading()) {
        <div class="mt-2 text-center text-[10px] text-slate-500 animate-pulse">Выполняется...</div>
      }
    </div>
  `
})
export class ReasoningPanelComponent {
  private instrumentariy = inject(InstrumentariyService);
  private state = inject(FormulationStateService);

  taskInput = '';
  readonly result = signal<ToolResult | null>(null);
  readonly loading = signal(false);
  readonly status = signal<GatewayStatus>('unknown');

  constructor() {
    this.checkConnection();
  }

  async checkConnection() {
    const ok = await this.instrumentariy.ping();
    this.status.set(this.instrumentariy.status());
    return ok;
  }

  async runComplexity() {
    if (!this.taskInput.trim()) return;
    this.loading.set(true);
    this.result.set(null);
    const res = await this.instrumentariy.reasonComplexity(this.taskInput);
    this.result.set(res);
    this.loading.set(false);
  }

  async runThink() {
    if (!this.taskInput.trim()) return;
    this.loading.set(true);
    this.result.set(null);
    const res = await this.instrumentariy.think(this.taskInput);
    this.result.set(res);
    this.loading.set(false);
  }

  formatResult(res: ToolResult): string {
    if (res.error) return res.error;
    if (res.data === undefined) return 'OK';
    if (typeof res.data === 'string') return res.data;
    return JSON.stringify(res.data, null, 2);
  }
}
