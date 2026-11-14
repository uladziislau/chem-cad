import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';
import { ICatalogIngredient } from '@modules/lab/services/catalog.service';

interface SafetyItem {
  ingredient: ICatalogIngredient;
  percent: number;
  level: 'danger' | 'hazardous' | 'caution';
  ghsCodes: string[];
}

/**
 * Баннер безопасности: показывает опасные ингредиенты в текущей рецептуре.
 */
@Component({
  selector: 'app-safety-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hazards().length > 0) {
      <div class="p-4 rounded-2xl border"
           [class.bg-red-950/40]="hasDanger()"
           [class.border-red-500/30]="hasDanger()"
           [class.bg-amber-950/30]="!hasDanger() && hasHazardous()"
           [class.border-amber-500/30]="!hasDanger() && hasHazardous()"
           [class.bg-slate-900/50]="!hasDanger() && !hasHazardous()"
           [class.border-white/10]="!hasDanger() && !hasHazardous()">
        
        <div class="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
               [class.text-red-400]="hasDanger()"
               [class.text-amber-400]="!hasDanger()"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="text-sm font-bold"
                [class.text-red-300]="hasDanger()"
                [class.text-amber-300]="!hasDanger()">
            {{ hasDanger() ? 'ОПАСНЫЕ КОМПОНЕНТЫ' : 'МЕРЫ ПРЕДОСТОРОЖНОСТИ' }}
          </span>
        </div>

        <div class="space-y-2">
          @for (item of hazards(); track item.ingredient.id) {
            <div class="flex items-start gap-2 text-xs">
              <span class="mt-0.5 w-2 h-2 rounded-full shrink-0"
                    [class.bg-red-500]="item.level === 'danger'"
                    [class.bg-amber-500]="item.level === 'hazardous'"
                    [class.bg-slate-400]="item.level === 'caution'"></span>
              <div class="flex-1">
                <div class="flex justify-between">
                  <span class="text-slate-200 font-medium">{{ item.ingredient.name }}</span>
                  <span class="text-slate-400 font-mono">{{ item.percent | number:'1.1-1' }}%</span>
                </div>
                @if (item.ghsCodes.length > 0) {
                  <div class="text-[10px] text-slate-500 font-mono mt-0.5">
                    GHS: {{ item.ghsCodes.join(', ') }}
                  </div>
                }
                @if (item.ingredient.ppe && item.ingredient.ppe.length > 0) {
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    СИЗ: {{ item.ingredient.ppe.join(', ') }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: []
})
export class SafetyBannerComponent {
  private state = inject(FormulationStateService);

  /** Опасные ингредиенты в текущей рецептуре. */
  hazards = computed<SafetyItem[]>(() => {
    const items = this.state.items();
    const total = this.state.totalMass();
    if (total <= 0) return [];

    return items
      .map(item => {
        const ing = item.ingredient;
        const percent = (item.massGrams / total) * 100;
        const level = this.getLevel(ing, percent);
        return level ? { ingredient: ing, percent, level, ghsCodes: ing.ghsCodes ?? [] } : null;
      })
      .filter((x): x is SafetyItem => x !== null)
      .sort((a, b) => {
        const order = { danger: 0, hazardous: 1, caution: 2 };
        return order[a.level] - order[b.level];
      });
  });

  hasDanger = computed(() => this.hazards().some(h => h.level === 'danger'));
  hasHazardous = computed(() => this.hazards().some(h => h.level === 'hazardous'));

  private getLevel(ing: ICatalogIngredient, percent: number): SafetyItem['level'] | null {
    if (ing.safetyLevel === 'danger' || ing.safetyLevel === 'hazardous') return ing.safetyLevel;
    if (ing.safetyLevel === 'caution' && percent > 5) return 'caution';
    // Fallback для ингредиентов без явного уровня
    if (ing.ghsCodes && ing.ghsCodes.length > 0 && percent > 10) return 'caution';
    return null;
  }
}
