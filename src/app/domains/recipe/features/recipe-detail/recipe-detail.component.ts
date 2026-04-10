import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RecipeService } from '../../services/recipe.service';
import { IngredientService } from '../../../formulation/services/ingredient.service';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    @if (recipe()) {
      <div class="space-y-8">
        <div class="flex items-center gap-4">
          <a routerLink="/recipes" class="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1 class="text-3xl font-bold text-slate-900">{{ recipe()?.name }}</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <!-- Ingredients -->
            <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 class="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <mat-icon class="mr-2 text-indigo-600">science</mat-icon>
                Ингредиенты
              </h2>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Компонент</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">%</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Назначение</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    @for (item of recipe()?.ingredients; track item.ingredientId) {
                      <tr>
                        <td class="px-4 py-3 text-sm text-slate-900 font-medium">{{ getIngredientName(item.ingredientId) }}</td>
                        <td class="px-4 py-3 text-sm text-slate-600">{{ item.percentage }}%</td>
                        <td class="px-4 py-3 text-sm text-slate-600">{{ item.purpose }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Steps -->
            <section class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 class="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <mat-icon class="mr-2 text-indigo-600">format_list_numbered</mat-icon>
                Порядок действий
              </h2>
              <ol class="space-y-4">
                @for (step of recipe()?.steps; track $index) {
                  <li class="flex gap-4">
                    <span class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {{ $index + 1 }}
                    </span>
                    <p class="text-slate-700 mt-1">{{ step }}</p>
                  </li>
                }
              </ol>
            </section>
          </div>

          <div class="space-y-8">
            <!-- Safety -->
            <section class="bg-rose-50 rounded-2xl border border-rose-100 p-6">
              <h2 class="text-xl font-semibold text-rose-900 mb-4 flex items-center">
                <mat-icon class="mr-2 text-rose-600">warning</mat-icon>
                Меры предосторожности
              </h2>
              <ul class="space-y-3">
                @for (warning of recipe()?.safetyWarnings; track $index) {
                  <li class="flex items-start gap-2 text-rose-800 text-sm">
                    <mat-icon class="text-[18px] w-[18px] h-[18px] mt-0.5 flex-shrink-0">error_outline</mat-icon>
                    <span>{{ warning }}</span>
                  </li>
                }
              </ul>
            </section>

            <!-- Info -->
            <section class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Информация</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-600">Категория:</span>
                  <span class="font-medium text-slate-900">{{ getCategoryName(recipe()?.category || '') }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Сложность:</span>
                  <span class="font-medium text-slate-900">{{ getDifficultyName(recipe()?.difficulty || '') }}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    } @else {
      <div class="text-center py-12">
        <p class="text-slate-500">Рецептура не найдена.</p>
        <a routerLink="/recipes" class="text-indigo-600 hover:underline mt-4 inline-block">Вернуться к списку</a>
      </div>
    }
  `
})
export class RecipeDetailComponent {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private ingredientService = inject(IngredientService);
  private params = toSignal(this.route.paramMap);

  recipe = computed(() => {
    const id = this.params()?.get('id');
    return id ? this.recipeService.getRecipeById(id) : undefined;
  });

  getIngredientName(id: string): string {
    return this.ingredientService.getIngredientById(id)?.name || id;
  }

  getCategoryName(category: string): string {
    const map: Record<string, string> = {
      'hygiene': 'Гигиена',
      'perfume': 'Парфюмерия',
      'cleaning': 'Бытовая химия'
    };
    return map[category] || category;
  }

  getDifficultyName(diff: string): string {
    const map: Record<string, string> = {
      'easy': 'Легко',
      'medium': 'Средне',
      'hard': 'Сложно'
    };
    return map[diff] || diff;
  }
}
