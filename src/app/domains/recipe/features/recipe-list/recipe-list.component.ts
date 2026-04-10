import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-slate-900">База рецептур</h1>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (recipe of recipes(); track recipe.id) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div class="p-6 flex-grow">
              <div class="flex items-center justify-between mb-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-blue-100]="recipe.category === 'cleaning'"
                      [class.text-blue-800]="recipe.category === 'cleaning'"
                      [class.bg-green-100]="recipe.category === 'hygiene'"
                      [class.text-green-800]="recipe.category === 'hygiene'"
                      [class.bg-purple-100]="recipe.category === 'perfume'"
                      [class.text-purple-800]="recipe.category === 'perfume'">
                  {{ getCategoryName(recipe.category) }}
                </span>
                <span class="inline-flex items-center text-xs font-medium text-slate-500">
                  <mat-icon class="text-[16px] w-4 h-4 mr-1">speed</mat-icon>
                  {{ getDifficultyName(recipe.difficulty) }}
                </span>
              </div>
              <h2 class="text-xl font-semibold text-slate-900 mb-2">{{ recipe.name }}</h2>
              <p class="text-slate-600 text-sm mb-4">{{ recipe.description }}</p>
            </div>
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <a [routerLink]="['/recipes', recipe.id]" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-center">
                Посмотреть рецептуру
                <mat-icon class="text-[18px] w-[18px] h-[18px] ml-1">arrow_forward</mat-icon>
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class RecipeListComponent {
  private recipeService = inject(RecipeService);
  recipes = this.recipeService.getRecipes();

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
