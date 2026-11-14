import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VersionHistoryService, FormulationVersion } from '@modules/lab/services/version-history.service';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';
import { SdsService } from '@modules/lab/services/sds.service';

@Component({
  selector: 'app-version-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white">История версий (ELN)</h3>
        <button (click)="togglePanel()" class="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" [class.rotate-180]="isOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <!-- Save current -->
        <div class="flex gap-2">
          <input type="text" [(ngModel)]="newVersionName" placeholder="Название версии"
                 class="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50">
          <button (click)="saveCurrent()" [disabled]="!newVersionName.trim() || state.items().length === 0"
                  class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all">
            Сохранить
          </button>
        </div>

        <!-- Version list -->
        @if (versions().length === 0) {
          <p class="text-xs text-slate-500 text-center py-4">Нет сохранённых версий</p>
        } @else {
          <div class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            @for (v of versions(); track v.id) {
              <div class="p-3 bg-slate-950/50 border border-white/5 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-xs font-bold text-white">v{{ v.version }} — {{ v.name }}</span>
                    <span class="text-[10px] text-slate-500 ml-2">{{ v.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button (click)="restore(v)" class="px-2 py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 rounded transition-colors">
                      Восстановить
                    </button>
                    <button (click)="deleteVersion(v.id)" class="px-2 py-1 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 rounded transition-colors">
                      ×
                    </button>
                  </div>
                </div>
                <div class="text-[10px] text-slate-500 font-mono">
                  {{ v.items.length }} ингредиентов · {{ v.totalMassG | number:'1.0-0' }} г · T={{ v.temperatureC }}°C
                </div>
              </div>
            }
          </div>
        }

        <!-- Compare -->
        @if (versions().length >= 2) {
          <div class="pt-2 border-t border-white/5 space-y-2">
            <div class="text-[10px] text-slate-500 uppercase font-bold">Сравнить версии</div>
            <div class="flex gap-2">
              <select [(ngModel)]="compareA" class="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <option value="">Версия A</option>
                @for (v of versions(); track v.id) {
                  <option [value]="v.id">v{{ v.version }} — {{ v.name }}</option>
                }
              </select>
              <select [(ngModel)]="compareB" class="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <option value="">Версия B</option>
                @for (v of versions(); track v.id) {
                  <option [value]="v.id">v{{ v.version }} — {{ v.name }}</option>
                }
              </select>
            </div>
            @if (compareA && compareB && compareA !== compareB) {
              <button (click)="runDiff()" class="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all">
                Показать diff
              </button>
            }
            @if (diffResult().length > 0) {
              <div class="space-y-1 max-h-32 overflow-y-auto">
                @for (d of diffResult(); track d.ingredientId) {
                  <div class="flex justify-between text-[10px] font-mono px-2 py-1 bg-slate-950/50 rounded">
                    <span class="text-slate-400">{{ d.name }}</span>
                    <span [class.text-emerald-400]="d.delta > 0" [class.text-red-400]="d.delta < 0">
                      {{ d.delta > 0 ? '+' : '' }}{{ d.delta | number:'1.1-1' }} г
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- SDS Export -->
        <div class="pt-2 border-t border-white/5">
          <button (click)="downloadSds()" [disabled]="state.items().length === 0"
                  class="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/30 transition-all">
            ⬇ Скачать SDS (паспорт безопасности)
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  `]
})
export class VersionHistoryComponent {
  state = inject(FormulationStateService);
  private versionHistory = inject(VersionHistoryService);
  private sds = inject(SdsService);

  isOpen = signal(false);
  versions = signal<FormulationVersion[]>([]);
  newVersionName = '';
  compareA = '';
  compareB = '';
  diffResult = signal<{ ingredientId: string; name: string; massA: number; massB: number; delta: number }[]>([]);

  constructor() {
    this.refresh();
  }

  togglePanel() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) this.refresh();
  }

  refresh() {
    this.versions.set(this.versionHistory.listVersions());
  }

  saveCurrent() {
    const name = this.newVersionName.trim();
    if (!name || this.state.items().length === 0) return;

    this.versionHistory.saveVersion(name, {
      temperatureC: this.state.targetTemperature(),
      mixerRpm: this.state.mixerRpm(),
      mixingTimeMin: this.state.mixingTimeMinutes(),
      totalMassG: this.state.totalMass(),
      items: this.state.items().map(item => ({
        ingredientId: item.ingredient.id,
        massGrams: item.massGrams
      }))
    });

    this.newVersionName = '';
    this.refresh();
  }

  restore(v: FormulationVersion) {
    const items = this.versionHistory.restoreItems(v.id);
    this.state.clearItems();
    for (const { ingredient, massGrams } of items) {
      this.state.addIngredient(ingredient, massGrams);
    }
    this.state.setTemperature(v.temperatureC);
    this.state.mixerRpm.set(v.mixerRpm);
    this.state.mixingTimeMinutes.set(v.mixingTimeMin);
  }

  deleteVersion(id: string) {
    this.versionHistory.deleteVersion(id);
    this.refresh();
  }

  runDiff() {
    if (!this.compareA || !this.compareB) return;
    this.diffResult.set(this.versionHistory.diffVersions(this.compareA, this.compareB));
  }

  downloadSds() {
    this.sds.downloadSds();
  }
}
