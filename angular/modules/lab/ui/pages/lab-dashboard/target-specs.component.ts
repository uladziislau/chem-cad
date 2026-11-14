import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConstraintSolver, TargetSpec, OptimizationConstraint, OptimizationResult } from '@root-modules/solvers/constraint-solver';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';
import { CatalogService } from '@modules/lab/services/catalog.service';

interface SpecRange {
  enabled: boolean;
  min: number;
  max: number;
}

@Component({
  selector: 'app-target-specs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white">Целевые свойства (Declarative)</h3>
        <button (click)="togglePanel()" class="text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" [class.rotate-180]="isOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      @if (isOpen()) {
        <div class="space-y-3">
          <!-- pH -->
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-xs text-slate-400 w-20">
              <input type="checkbox" [(ngModel)]="specs.ph.enabled" class="accent-indigo-500">
              pH
            </label>
            @if (specs.ph.enabled) {
              <div class="flex items-center gap-1 flex-1">
                <input type="number" [(ngModel)]="specs.ph.min" step="0.1" min="0" max="14"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <span class="text-slate-500">—</span>
                <input type="number" [(ngModel)]="specs.ph.max" step="0.1" min="0" max="14"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
              </div>
            }
          </div>

          <!-- Viscosity -->
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-xs text-slate-400 w-20">
              <input type="checkbox" [(ngModel)]="specs.viscosity.enabled" class="accent-indigo-500">
              Вязкость
            </label>
            @if (specs.viscosity.enabled) {
              <div class="flex items-center gap-1 flex-1">
                <input type="number" [(ngModel)]="specs.viscosity.min" step="0.1" min="0"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <span class="text-slate-500">—</span>
                <input type="number" [(ngModel)]="specs.viscosity.max" step="0.1" min="0"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <span class="text-[10px] text-slate-500">cP</span>
              </div>
            }
          </div>

          <!-- Stability -->
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-xs text-slate-400 w-20">
              <input type="checkbox" [(ngModel)]="specs.stability.enabled" class="accent-indigo-500">
              Стабильность
            </label>
            @if (specs.stability.enabled) {
              <div class="flex items-center gap-1 flex-1">
                <input type="number" [(ngModel)]="specs.stability.min" step="1" min="0"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <span class="text-slate-500">—</span>
                <input type="number" [(ngModel)]="specs.stability.max" step="1" min="0"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <span class="text-[10px] text-slate-500">дней</span>
              </div>
            }
          </div>

          <!-- HLB -->
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-xs text-slate-400 w-20">
              <input type="checkbox" [(ngModel)]="specs.hlb.enabled" class="accent-indigo-500">
              HLB
            </label>
            @if (specs.hlb.enabled) {
              <div class="flex items-center gap-1 flex-1">
                <input type="number" [(ngModel)]="specs.hlb.min" step="0.5" min="0" max="20"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
                <span class="text-slate-500">—</span>
                <input type="number" [(ngModel)]="specs.hlb.max" step="0.5" min="0" max="20"
                       class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white">
              </div>
            }
          </div>

          <button (click)="runOptimization()" [disabled]="isOptimizing() || !hasAnySpec()"
                  class="w-full py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all">
            {{ isOptimizing() ? 'Оптимизация...' : 'Подобрать состав' }}
          </button>

          @if (optimizationResult()) {
            <div class="p-3 bg-slate-950/50 rounded-xl border border-white/5 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-[10px] text-slate-500 uppercase">Результат</span>
                <span class="text-[10px] font-mono" [class.text-emerald-400]="optimizationResult()!.converged" [class.text-amber-400]="!optimizationResult()!.converged">
                  {{ optimizationResult()!.converged ? 'Сошлось' : 'Не сошлось' }}
                </span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div class="text-slate-400">pH: <span class="text-white">{{ optimizationResult()!.metrics.ph | number:'1.1-1' }}</span></div>
                <div class="text-slate-400">Вязк: <span class="text-white">{{ optimizationResult()!.metrics.viscosityCps | number:'1.1-1' }}</span></div>
                <div class="text-slate-400">Стаб: <span class="text-white">{{ optimizationResult()!.metrics.stabilityDays | number:'1.0-0' }}</span></div>
                <div class="text-slate-400">HLB: <span class="text-white">{{ optimizationResult()!.metrics.hlb | number:'1.1-1' }}</span></div>
              </div>
              <div class="text-[10px] text-slate-500">Итераций: {{ optimizationResult()!.iterations }} · Loss: {{ optimizationResult()!.totalLoss | number:'1.2-2' }}</div>

              <!-- Recipe breakdown -->
              <div class="pt-2 border-t border-white/5 space-y-1">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Состав</div>
                @for (input of optimizationResult()!.recipe; track input.entity.getName()) {
                  @if (catalog.findByEntity(input.entity); as ing) {
                    <div class="flex justify-between text-[10px] font-mono">
                      <span class="text-slate-400 truncate">{{ ing.name }}</span>
                      <span class="text-white">{{ input.massGrams | number:'1.1-1' }} г ({{ (input.massGrams / state.totalMass() * 100) | number:'1.1-1' }}%)</span>
                    </div>
                  }
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TargetSpecsComponent {
  private state = inject(FormulationStateService);
  private catalog = inject(CatalogService);

  isOpen = signal(false);
  isOptimizing = signal(false);
  optimizationResult = signal<OptimizationResult | null>(null);

  specs = {
    ph: { enabled: false, min: 5.0, max: 7.0 } as SpecRange,
    viscosity: { enabled: false, min: 1, max: 100 } as SpecRange,
    stability: { enabled: false, min: 30, max: 365 } as SpecRange,
    hlb: { enabled: false, min: 8, max: 12 } as SpecRange
  };

  hasAnySpec(): boolean {
    return this.specs.ph.enabled || this.specs.viscosity.enabled ||
           this.specs.stability.enabled || this.specs.hlb.enabled;
  }

  togglePanel() {
    this.isOpen.update(v => !v);
  }

  runOptimization() {
    const items = this.state.items();
    if (items.length === 0) return;

    this.isOptimizing.set(true);

    // Формируем constraints из текущих ингредиентов
    const constraints: OptimizationConstraint[] = items.map(item => ({
      ingredient: {
        entity: item.ingredient.entity,
        category: item.ingredient.category,
        minPercent: 0,
        maxPercent: 100,
        stepPercent: 1,
        name: item.ingredient.name
      },
      targetPercent: (item.massGrams / this.state.totalMass()) * 100
    }));

    const targetSpec: TargetSpec = {};
    if (this.specs.ph.enabled) targetSpec.ph = { min: this.specs.ph.min, max: this.specs.ph.max };
    if (this.specs.viscosity.enabled) targetSpec.viscosityCps = { min: this.specs.viscosity.min, max: this.specs.viscosity.max };
    if (this.specs.stability.enabled) targetSpec.stabilityDays = { min: this.specs.stability.min, max: this.specs.stability.max };
    if (this.specs.hlb.enabled) targetSpec.hlb = { min: this.specs.hlb.min, max: this.specs.hlb.max };

    // Запускаем оптимизацию асинхронно, чтобы не блокировать UI
    setTimeout(() => {
      const result = ConstraintSolver.optimize(constraints, targetSpec, this.state.totalMass(), 200);
      this.optimizationResult.set(result);
      this.isOptimizing.set(false);

      // Применяем результат к состоянию
      this.state.clearItems();
      for (const input of result.recipe) {
        const ing = this.catalog.findByEntity(input.entity);
        if (ing) {
          this.state.addIngredient(ing, input.massGrams);
        }
      }
    }, 100);
  }
}
