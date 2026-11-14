import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoFormulator, FormulationReport, IFormulationTargets } from '@root-modules/solvers/auto-formulator';
import { Mass } from '@root-modules/units/quantities';
import { IOil, ISurfactant } from '@domain/entities/surfactant.interface';
import { PureSubstance } from '@domain/entities/pure-substance';
import { ICatalogIngredient, CatalogService } from '@modules/lab/services/catalog.service';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';

interface SurfactantPick {
  ingredient: ICatalogIngredient;
  checked: boolean;
}

/**
 * Панель автоформулятора: подбор пары ПАВ под целевые показатели
 * (моющая способность, время высыхания) через AutoFormulator.optimizeEmulsion.
 */
@Component({
  selector: 'app-formulation-optimizer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Автоформулятор
        </h3>
        <button (click)="isOpen.set(!isOpen())" class="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" [class.rotate-180]="isOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="space-y-3">
          <!-- Масла -->
          <div>
            <div class="text-[10px] text-slate-500 uppercase font-bold">Масляная фаза</div>
            <select id="opt-oil" [(ngModel)]="selectedOilId"
                    class="mt-1 w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
              @for (oil of oils(); track oil.id) {
                <option [value]="oil.id">{{ oil.name }} (HLB {{ oilHlb(oil) }})</option>
              }
            </select>
            <div class="flex items-center gap-2 mt-1">
              <input type="number" [(ngModel)]="oilMassG" min="0" step="1"
                     class="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
              <span class="text-[10px] text-slate-500">г масла</span>
            </div>
          </div>

          <!-- Вода -->
          <div>
            <div class="text-[10px] text-slate-500 uppercase font-bold">Водная фаза</div>
            <select id="opt-water" [(ngModel)]="selectedWaterId"
                    class="mt-1 w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
              @for (w of waters(); track w.id) {
                <option [value]="w.id">{{ w.name }}</option>
              }
            </select>
            <div class="flex items-center gap-2 mt-1">
              <input type="number" [(ngModel)]="waterMassG" min="0" step="1"
                     class="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
              <span class="text-[10px] text-slate-500">г воды</span>
            </div>
          </div>

          <!-- ПАВ -->
          <div>
            <div class="text-[10px] text-slate-500 uppercase font-bold block">ПАВ (кандидаты для пары)</div>
            <div class="mt-1 max-h-28 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              @for (pick of surfactantPicks(); track pick.ingredient.id) {
                <label class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer">
                  <input type="checkbox" [checked]="pick.checked" (change)="toggleSurfactant(pick.ingredient.id)"
                         class="accent-violet-500">
                  <span class="flex-1 truncate">{{ pick.ingredient.name }}</span>
                  <span class="text-[10px] font-mono text-slate-500">HLB {{ surfactantHlb(pick.ingredient) }}</span>
                </label>
              }
            </div>
            <div class="flex items-center gap-2 mt-1">
              <input type="number" [(ngModel)]="surfactantMassG" min="0" step="0.5"
                     class="w-20 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
              <span class="text-[10px] text-slate-500">г ПАВ суммарно</span>
            </div>
          </div>

          <!-- Цели -->
          <div class="pt-2 border-t border-white/5 space-y-2">
            <div class="text-[10px] text-slate-500 uppercase font-bold">Целевые показатели</div>
            <div class="grid grid-cols-3 gap-2">
              <label class="text-[10px] text-slate-400">
                Моющая ≥
                <input type="number" [(ngModel)]="targets.minDetergencyScore" min="0" max="100" step="5"
                       class="mt-0.5 w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white">
              </label>
              <label class="text-[10px] text-slate-400">
                Сухой ≤, мин
                <input type="number" [(ngModel)]="targets.maxTouchDryTimeMin" min="0" step="10"
                       class="mt-0.5 w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white">
              </label>
              <label class="text-[10px] text-slate-400">
                Полим. ≤, мин
                <input type="number" [(ngModel)]="targets.maxFullDryTimeMin" min="0" step="30"
                       class="mt-0.5 w-full bg-slate-950 border border-white/10 rounded px-1.5 py-1 text-xs text-white">
              </label>
            </div>
            <div class="text-[10px] text-slate-600">Пустое поле = цель не задана</div>
          </div>

          <button (click)="runOptimize()" [disabled]="isOptimizing() || !canRun()"
                  class="w-full py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all">
            {{ isOptimizing() ? 'Подбор...' : 'Подобрать рецептуру' }}
          </button>

          @if (error()) {
            <div class="p-2 rounded-lg bg-rose-950/40 border border-rose-500/20 text-[10px] text-rose-300">
              {{ error() }}
            </div>
          }

          @if (report(); as r) {
            <div class="p-3 bg-slate-950/50 rounded-xl border border-violet-500/20 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-[10px] text-slate-500 uppercase">Оптимальная пара ПАВ</span>
                <span class="text-[10px] font-mono text-violet-300">\${{ r.totalCost | number:'1.3-3' }}</span>
              </div>
              @for (s of r.surfactantsUsed; track s.name) {
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-300">{{ s.name }}</span>
                  <span class="font-mono text-slate-400">{{ s.amount | number:'1.2-2' }} г</span>
                </div>
              }
              <div class="pt-2 border-t border-white/5 grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div class="text-slate-400">Раздражение: <span class="text-white">{{ r.averageIrritation | number:'1.2-2' }}</span></div>
                <div class="text-slate-400">Эко: <span [class.text-emerald-400]="r.isEco" [class.text-slate-500]="!r.isEco">{{ r.isEco ? 'да' : 'нет' }}</span></div>
                @if (r.detergencyScore !== undefined) {
                  <div class="text-slate-400">Моющая: <span class="text-white">{{ r.detergencyScore | number:'1.0-0' }}</span></div>
                }
                @if (r.touchDryTimeMin !== undefined) {
                  <div class="text-slate-400">Сухой на отлип: <span class="text-white">{{ r.touchDryTimeMin | number:'1.0-0' }} мин</span></div>
                }
                @if (r.fullDryTimeMin !== undefined) {
                  <div class="text-slate-400">Полимеризация: <span class="text-white">{{ r.fullDryTimeMin | number:'1.0-0' }} мин</span></div>
                }
                @if (r.dryingMechanism) {
                  <div class="text-slate-400">Механизм: <span class="text-white">{{ r.dryingMechanism }}</span></div>
                }
              </div>
              <button (click)="addToFormulation(r)"
                      class="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all">
                Добавить в рецептуру
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    select option { background: #0f172a; color: #e2e8f0; }
  `]
})
export class FormulationOptimizerComponent {
  private catalog = inject(CatalogService);
  private state = inject(FormulationStateService);

  isOpen = signal(false);
  isOptimizing = signal(false);
  error = signal<string | null>(null);
  report = signal<FormulationReport | null>(null);

  oils = computed(() => this.catalog.getAllIngredients().filter(i => i.category === 'oil'));
  waters = computed(() => this.catalog.getAllIngredients().filter(i => i.category === 'water'));
  surfactantPicks = signal<SurfactantPick[]>([]);

  selectedOilId = '';
  selectedWaterId = '';
  oilMassG = 50;
  waterMassG = 50;
  surfactantMassG = 5;
  targets: IFormulationTargets = {};

  constructor() {
    const surfactants = this.catalog.getAllIngredients().filter(i => i.category === 'surfactant');
    this.surfactantPicks.set(surfactants.map(s => ({ ingredient: s, checked: true })));
    if (this.oils().length > 0) this.selectedOilId = this.oils()[0].id;
    if (this.waters().length > 0) this.selectedWaterId = this.waters()[0].id;
  }

  oilHlb(oil: ICatalogIngredient): number {
    const e = oil.entity as unknown as IOil;
    return typeof e?.requiredHlb === 'number' ? e.requiredHlb : 0;
  }

  surfactantHlb(ing: ICatalogIngredient): number {
    const e = ing.entity as unknown as ISurfactant;
    return typeof e?.hlb === 'number' ? e.hlb : 0;
  }

  toggleSurfactant(id: string) {
    this.surfactantPicks.update(picks =>
      picks.map(p => p.ingredient.id === id ? { ...p, checked: !p.checked } : p)
    );
  }

  canRun(): boolean {
    return this.selectedOilId !== '' && this.selectedWaterId !== '' &&
           this.surfactantPicks().some(p => p.checked) &&
           this.oilMassG > 0 && this.waterMassG > 0 && this.surfactantMassG > 0;
  }

  runOptimize() {
    this.error.set(null);
    this.report.set(null);
    this.isOptimizing.set(true);

    try {
      const oil = this.catalog.getIngredientById(this.selectedOilId);
      const water = this.catalog.getIngredientById(this.selectedWaterId);
      if (!oil || !water) throw new Error('Не выбраны фазы');

      const oilEntity = oil.entity as unknown as IOil;
      const waterEntity = water.entity as PureSubstance;
      if (typeof oilEntity?.requiredHlb !== 'number') {
        throw new Error('У выбранной масляной фазы нет requiredHlb');
      }

      const surfactants = this.surfactantPicks()
        .filter(p => p.checked)
        .map(p => p.ingredient.entity as unknown as ISurfactant);
      if (surfactants.length < 2) {
        throw new Error('Нужно минимум 2 ПАВ (один с HLB ниже, один выше целевого)');
      }

      const t: IFormulationTargets = {};
      if (this.targets.minDetergencyScore !== undefined && this.targets.minDetergencyScore !== null) {
        t.minDetergencyScore = this.targets.minDetergencyScore;
      }
      if (this.targets.maxTouchDryTimeMin !== undefined && this.targets.maxTouchDryTimeMin !== null) {
        t.maxTouchDryTimeMin = this.targets.maxTouchDryTimeMin;
      }
      if (this.targets.maxFullDryTimeMin !== undefined && this.targets.maxFullDryTimeMin !== null) {
        t.maxFullDryTimeMin = this.targets.maxFullDryTimeMin;
      }

      // targets передаём только если задано хотя бы одно поле
      const hasTargets = Object.keys(t).length > 0;
      const result = AutoFormulator.optimizeEmulsion(
        oilEntity,
        new Mass(this.oilMassG, 'g'),
        waterEntity,
        new Mass(this.waterMassG, 'g'),
        surfactants,
        new Mass(this.surfactantMassG, 'g'),
        hasTargets ? t : undefined,
        25
      );

      this.report.set(result);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Ошибка оптимизации');
    } finally {
      this.isOptimizing.set(false);
    }
  }

  addToFormulation(r: FormulationReport) {
    const water = this.catalog.getIngredientById(this.selectedWaterId);
    const oil = this.catalog.getIngredientById(this.selectedOilId);
    if (water) this.state.addIngredient(water, this.waterMassG);
    if (oil) this.state.addIngredient(oil, this.oilMassG);
    for (const s of r.surfactantsUsed) {
      const ing = this.catalog.getAllIngredients().find(i => i.name === s.name);
      if (ing) this.state.addIngredient(ing, s.amount);
    }
    this.isOpen.set(false);
  }
}
