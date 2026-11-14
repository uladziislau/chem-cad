import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { FormulationDraftService } from '@modules/formulation/services/formulation-draft.service';
import { RecipeService } from '@modules/recipe/services/recipe.service';
import { formulationToRecipe } from '@root-modules/recipe/formulation-export';
import { Ingredient, FormulationItem } from '@root-modules/formulation/models/ingredient.model';

@Component({
  selector: 'app-formulator',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Формулатор</h1>
          <p class="text-slate-600 mt-2">Создайте свою собственную рецептуру, добавляя компоненты.</p>
        </div>
        <a routerLink="/formulator/ingredients"
           class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shrink-0">
          Каталог ингредиентов
        </a>
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
                      <span class="material-icons text-[18px] w-[18px] h-[18px]">add</span>
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
              <div>
                <h2 class="text-xl font-semibold text-slate-900">Текущая рецептура</h2>
                <p class="text-xs text-slate-400 mt-1">Автосохранение в браузере</p>
              </div>
              <div class="flex items-center gap-4">
                @if (formulation().length > 0) {
                  <button type="button" (click)="clearFormulation()"
                          class="text-xs font-medium text-rose-600 hover:text-rose-800">
                    Очистить
                  </button>
                }
                <div class="text-lg font-bold" [class.text-rose-600]="totalPercentage() > 100" [class.text-green-600]="totalPercentage() === 100" [class.text-slate-700]="totalPercentage() < 100">
                  Итого: {{ totalPercentage() }}%
                </div>
              </div>
            </div>

            @if (formulation().length === 0) {
              <div class="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <span class="material-icons text-slate-400 text-4xl mb-2">science</span>
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
                      <span class="material-icons text-[20px] w-[20px] h-[20px]">delete</span>
                    </button>
                  </div>
                }
              </div>

              @if (totalPercentage() !== 100) {
                <div class="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <span class="material-icons text-amber-600 mt-0.5">warning</span>
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

              <!-- Save as Recipe -->
              <div class="mt-8 pt-6 border-t border-slate-200">
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Сохранить как рецепт</h3>
                <div class="flex flex-wrap items-end gap-3">
                  <label class="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Название
                    <input type="text" [(ngModel)]="recipeDraft.name"
                           placeholder="Моя рецептура"
                           class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56 focus:ring-indigo-500 focus:border-indigo-500">
                  </label>
                  <label class="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Категория
                    <select [(ngModel)]="recipeDraft.category"
                            class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="hygiene">Гигиена</option>
                      <option value="perfume">Парфюмерия</option>
                      <option value="cleaning">Клининг</option>
                    </select>
                  </label>
                  <button type="button" (click)="saveAsRecipe()"
                          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Сохранить рецепт
                  </button>
                </div>
                @if (recipeSaved(); as savedId) {
                  <p class="mt-3 text-sm text-green-700">
                    Рецепт сохранён —
                    <a [routerLink]="['/recipes', 'detail', savedId]" class="font-medium underline">открыть</a>
                  </p>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class FormulatorComponent {
  private ingredientService = inject(IngredientService);
  private draftService = inject(FormulationDraftService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  /** Черновик экспорта в Recipe: имя + категория. */
  recipeDraft = { name: '', category: 'hygiene' as 'hygiene' | 'perfume' | 'cleaning' };
  /** id сохранённого рецепта для ссылки «открыть»; null — ещё не сохраняли. */
  recipeSaved = signal<string | null>(null);

  availableIngredients = this.ingredientService.getIngredients();
  /** Рецептура автосохраняется в localStorage через FormulationDraftService. */
  formulation = signal<FormulationItem[]>(this.draftService.getItems()());

  totalPercentage = computed(() => {
    return Number(this.formulation().reduce((sum, item) => sum + (item.percentage || 0), 0).toFixed(2));
  });

  addIngredient(ingredient: Ingredient) {
    const current = this.formulation();
    if (!current.find(i => i.ingredient.id === ingredient.id)) {
      this.setFormulation([...current, { ingredient, percentage: 0 }]);
    }
  }

  removeIngredient(index: number) {
    const current = [...this.formulation()];
    current.splice(index, 1);
    this.setFormulation(current);
  }

  updatePercentage(index: number, value: number) {
    const current = [...this.formulation()];
    current[index].percentage = value;
    this.setFormulation(current);
  }

  clearFormulation() {
    this.draftService.clear();
    this.formulation.set([]);
  }

  private setFormulation(items: FormulationItem[]) {
    this.formulation.set(items);
    this.draftService.setItems(items);
  }

  /** Сохраняет текущую рецептуру как пользовательский Recipe и переходит к нему. */
  saveAsRecipe() {
    const items = this.formulation();
    if (items.length === 0) return;
    const draft = formulationToRecipe(items.map(i => ({
      ingredientId: i.ingredient.id,
      name: i.ingredient.name,
      type: i.ingredient.type,
      description: i.ingredient.description,
      safety: i.ingredient.safety,
      percentage: i.percentage,
    })), this.recipeDraft);
    const recipe = this.recipeService.addRecipe(draft);
    this.recipeSaved.set(recipe.id);
    this.router.navigate(['/recipes', 'detail', recipe.id]);
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
