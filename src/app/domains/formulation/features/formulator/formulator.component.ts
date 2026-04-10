import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IngredientService } from '../../services/ingredient.service';
import { Ingredient, FormulationItem } from '../../models/ingredient.model';

@Component({
  selector: 'app-formulator',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Формулатор</h1>
        <p class="text-slate-600 mt-2">Создайте свою собственную рецептуру, добавляя компоненты.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Ingredients Selection -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 class="text-lg font-semibold text-slate-900 mb-4">Доступные компоненты</h2>
            
            <div class="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              @for (ingredient of availableIngredients(); track ingredient.id) {
                <div class="p-3 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors cursor-pointer"
                     (click)="addIngredient(ingredient)"
                     (keydown.enter)="addIngredient(ingredient)"
                     tabindex="0">
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-medium text-slate-900 text-sm">{{ ingredient.name }}</h3>
                      <p class="text-xs text-slate-500 mt-1">{{ getTypeName(ingredient.type) }}</p>
                    </div>
                    <button class="text-indigo-600 hover:bg-indigo-50 p-1 rounded-md">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">add</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Current Formulation -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-slate-900">Текущая рецептура</h2>
              <div class="text-lg font-bold" [class.text-rose-600]="totalPercentage() > 100" [class.text-green-600]="totalPercentage() === 100" [class.text-slate-700]="totalPercentage() < 100">
                Итого: {{ totalPercentage() }}%
              </div>
            </div>

            @if (formulation().length === 0) {
              <div class="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <mat-icon class="text-slate-400 text-4xl mb-2">science</mat-icon>
                <p class="text-slate-500">Добавьте компоненты из списка слева</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (item of formulation(); track item.ingredient.id; let i = $index) {
                  <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div class="flex-grow">
                      <h3 class="font-medium text-slate-900">{{ item.ingredient.name }}</h3>
                      <p class="text-xs text-slate-500">{{ getTypeName(item.ingredient.type) }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <input type="number" 
                             [ngModel]="item.percentage" 
                             (ngModelChange)="updatePercentage(i, $event)"
                             min="0" max="100" step="0.1"
                             class="w-20 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <span class="text-slate-500">%</span>
                    </div>
                    <button (click)="removeIngredient(i)" class="text-rose-500 hover:bg-rose-50 p-2 rounded-md transition-colors">
                      <mat-icon class="text-[20px] w-[20px] h-[20px]">delete</mat-icon>
                    </button>
                  </div>
                }
              </div>

              @if (totalPercentage() !== 100) {
                <div class="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <mat-icon class="text-amber-600 mt-0.5">warning</mat-icon>
                  <p class="text-sm text-amber-800">
                    Сумма всех компонентов должна составлять ровно 100%. Сейчас: {{ totalPercentage() }}%.
                  </p>
                </div>
              }

              <!-- Safety Analysis -->
              @if (formulation().length > 0) {
                <div class="mt-8 pt-6 border-t border-slate-200">
                  <h3 class="text-lg font-semibold text-slate-900 mb-4">Анализ безопасности</h3>
                  <ul class="space-y-3">
                    @for (item of formulation(); track item.ingredient.id) {
                      <li class="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span class="font-medium">{{ item.ingredient.name }}:</span> {{ item.ingredient.safety }}
                      </li>
                    }
                  </ul>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class FormulatorComponent {
  private ingredientService = inject(IngredientService);
  
  availableIngredients = this.ingredientService.getIngredients();
  formulation = signal<FormulationItem[]>([]);

  totalPercentage = computed(() => {
    return Number(this.formulation().reduce((sum, item) => sum + (item.percentage || 0), 0).toFixed(2));
  });

  addIngredient(ingredient: Ingredient) {
    const current = this.formulation();
    if (!current.find(i => i.ingredient.id === ingredient.id)) {
      this.formulation.set([...current, { ingredient, percentage: 0 }]);
    }
  }

  removeIngredient(index: number) {
    const current = [...this.formulation()];
    current.splice(index, 1);
    this.formulation.set(current);
  }

  updatePercentage(index: number, value: number) {
    const current = [...this.formulation()];
    current[index].percentage = value;
    this.formulation.set(current);
  }

  getTypeName(type: string): string {
    const map: Record<string, string> = {
      'surfactant': 'ПАВ',
      'solvent': 'Растворитель',
      'fragrance': 'Отдушка / Эфирное масло',
      'preservative': 'Консервант',
      'active': 'Активный компонент',
      'base': 'Основа',
      'additive': 'Добавка'
    };
    return map[type] || type;
  }
}
