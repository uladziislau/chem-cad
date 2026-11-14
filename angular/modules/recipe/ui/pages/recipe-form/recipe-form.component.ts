import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeService } from '@modules/recipe/services/recipe.service';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { Recipe, RecipeIngredient } from '@root-modules/recipe/models/recipe.model';

type Category = 'hygiene' | 'perfume' | 'cleaning';
type Difficulty = 'easy' | 'medium' | 'hard';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'hygiene', label: 'Гигиена' },
  { value: 'perfume', label: 'Парфюмерия' },
  { value: 'cleaning', label: 'Клининг' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Простой' },
  { value: 'medium', label: 'Средний' },
  { value: 'hard', label: 'Сложный' },
];

interface DraftIngredient extends RecipeIngredient {
  /** ключ строки для trackBy */
  rowId: number;
}

interface Draft {
  name: string;
  category: Category;
  difficulty: Difficulty;
  description: string;
  ingredients: DraftIngredient[];
  steps: string[];
  safetyWarnings: string[];
}

let rowSeq = 0;

function emptyIngredient(): DraftIngredient {
  return { rowId: ++rowSeq, ingredientId: '', percentage: 0, purpose: '' };
}

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/recipes" class="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
          <span class="material-icons">arrow_back</span>
        </a>
        <div>
          <h1 class="text-3xl font-bold text-slate-900">{{ isEdit ? 'Редактирование рецептуры' : 'Новая рецептура' }}</h1>
          <p class="text-slate-600 mt-1">{{ isEdit ? 'Изменения сохранятся локально.' : 'Сохранённая рецептура появится в общем списке и хранится локально.' }}</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
        <!-- Основное -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="r-name" class="block text-xs font-bold text-slate-500 uppercase mb-1">Название</label>
            <input id="r-name" type="text" [(ngModel)]="draft.name" placeholder="Например: Гель для душа «Лаванда»"
                   class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label for="r-desc" class="block text-xs font-bold text-slate-500 uppercase mb-1">Описание</label>
            <input id="r-desc" type="text" [(ngModel)]="draft.description" placeholder="Краткое описание"
                   class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div>
            <label for="r-cat" class="block text-xs font-bold text-slate-500 uppercase mb-1">Категория</label>
            <select id="r-cat" [(ngModel)]="draft.category"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              @for (c of categoryOptions; track c.value) {
                <option [value]="c.value">{{ c.label }}</option>
              }
            </select>
          </div>
          <div>
            <label for="r-diff" class="block text-xs font-bold text-slate-500 uppercase mb-1">Сложность</label>
            <select id="r-diff" [(ngModel)]="draft.difficulty"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              @for (d of difficultyOptions; track d.value) {
                <option [value]="d.value">{{ d.label }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Ингредиенты -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Ингредиенты</h2>
            <button type="button" (click)="addIngredient()"
                    class="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              + Добавить компонент
            </button>
          </div>
          <div class="space-y-2">
            @for (item of draft.ingredients; track item.rowId) {
              <div class="grid grid-cols-[1fr_90px_1fr_auto] gap-2 items-center">
                <select [(ngModel)]="item.ingredientId"
                        class="ingredient-select px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                  <option value="">— компонент —</option>
                  @for (ing of ingredients(); track ing.id) {
                    <option [value]="ing.id">{{ ing.name }}</option>
                  }
                </select>
                <input type="number" [(ngModel)]="item.percentage" min="0" max="100" step="0.1" placeholder="%"
                       class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-center">
                <input type="text" [(ngModel)]="item.purpose" placeholder="Назначение"
                       class="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <button type="button" (click)="removeIngredient(item.rowId)"
                        class="p-2 text-slate-400 hover:text-rose-600" title="Убрать">
                  <span class="material-icons text-lg">close</span>
                </button>
              </div>
            }
          </div>
          <div class="mt-2 flex items-center gap-3 text-xs">
            <span class="text-slate-500">Сумма: <strong [class.text-emerald-600]="percentageSum() === 100" [class.text-amber-600]="percentageSum() !== 100">{{ percentageSum() }}%</strong></span>
            @if (percentageSum() !== 100) {
              <span class="text-amber-600">(рекомендуется 100%)</span>
            }
          </div>
        </div>

        <!-- Шаги -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Порядок действий</h2>
            <button type="button" (click)="addStep()"
                    class="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              + Добавить шаг
            </button>
          </div>
          <div class="space-y-2">
            @for (step of draft.steps; track $index) {
              <div class="flex gap-2 items-start">
                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-2">{{ $index + 1 }}</span>
                <textarea [(ngModel)]="draft.steps[$index]" rows="1"
                          class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                <button type="button" (click)="removeStep($index)"
                        class="p-2 text-slate-400 hover:text-rose-600 mt-1" title="Убрать шаг">
                  <span class="material-icons text-lg">close</span>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Предостережения -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-bold text-slate-700 uppercase">Меры предосторожности</h2>
            <button type="button" (click)="addWarning()"
                    class="text-xs font-medium text-indigo-600 hover:text-indigo-800">
              + Добавить
            </button>
          </div>
          <div class="space-y-2">
            @for (warning of draft.safetyWarnings; track $index) {
              <div class="flex gap-2 items-center">
                <span class="material-icons text-rose-400 text-lg shrink-0">warning</span>
                <input type="text" [(ngModel)]="draft.safetyWarnings[$index]" placeholder="Мера предосторожности"
                       class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <button type="button" (click)="removeWarning($index)"
                        class="p-2 text-slate-400 hover:text-rose-600" title="Убрать">
                  <span class="material-icons text-lg">close</span>
                </button>
              </div>
            }
          </div>
        </div>

        @if (formError()) {
          <p class="text-sm text-rose-600">{{ formError() }}</p>
        }

        <div class="flex gap-3 pt-2">
          <button type="button" (click)="save()" [disabled]="!canSave()"
                  class="flex-1 px-4 py-2.5 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
            {{ isEdit ? 'Сохранить изменения' : 'Сохранить рецептуру' }}
          </button>
          <a routerLink="/recipes"
             class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            Отмена
          </a>
        </div>
      </div>
    </div>
  `,
})
export class RecipeFormComponent {
  private recipeService = inject(RecipeService);
  private ingredientService = inject(IngredientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** id редактируемой рецептуры (undefined = создание) */
  editingId: string | undefined;
  isEdit = false;

  ingredients = this.ingredientService.getIngredients();
  categoryOptions = CATEGORY_OPTIONS;
  difficultyOptions = DIFFICULTY_OPTIONS;

  draft: Draft = {
    name: '',
    category: 'hygiene',
    difficulty: 'easy',
    description: '',
    ingredients: [emptyIngredient()],
    steps: [''],
    safetyWarnings: [''],
  };

  formError = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const recipe = this.recipeService.getRecipeById(id);
      if (recipe && recipe.isCustom) {
        this.editingId = id;
        this.isEdit = true;
        this.loadDraft(recipe);
      }
    }
  }

  private loadDraft(recipe: Recipe): void {
    this.draft = {
      name: recipe.name,
      category: recipe.category,
      difficulty: recipe.difficulty,
      description: recipe.description,
      ingredients: recipe.ingredients.map(i => ({ ...i, rowId: ++rowSeq })),
      steps: recipe.steps.length ? [...recipe.steps] : [''],
      safetyWarnings: recipe.safetyWarnings.length ? [...recipe.safetyWarnings] : [''],
    };
  }

  percentageSum(): number {
    const sum = this.draft.ingredients.reduce((acc, i) => acc + (Number(i.percentage) || 0), 0);
    return Math.round(sum * 10) / 10;
  }

  canSave(): boolean {
    return this.draft.name.trim().length > 0
      && this.draft.description.trim().length > 0
      && this.draft.ingredients.some(i => i.ingredientId)
      && this.draft.steps.some(s => s.trim().length > 0);
  }

  addIngredient(): void {
    this.draft.ingredients.push(emptyIngredient());
  }

  removeIngredient(rowId: number): void {
    this.draft.ingredients = this.draft.ingredients.filter(i => i.rowId !== rowId);
  }

  addStep(): void {
    this.draft.steps.push('');
  }

  removeStep(index: number): void {
    this.draft.steps.splice(index, 1);
  }

  addWarning(): void {
    this.draft.safetyWarnings.push('');
  }

  removeWarning(index: number): void {
    this.draft.safetyWarnings.splice(index, 1);
  }

  save(): void {
    const d = this.draft;
    const ingredients = d.ingredients
      .filter(i => i.ingredientId)
      .map(i => ({
        ingredientId: i.ingredientId,
        percentage: Number(i.percentage) || 0,
        purpose: i.purpose.trim(),
      }));
    const steps = d.steps.map(s => s.trim()).filter(s => s.length > 0);
    const safetyWarnings = d.safetyWarnings.map(s => s.trim()).filter(s => s.length > 0);

    if (!d.name.trim() || !d.description.trim()) {
      this.formError.set('Заполните название и описание.');
      return;
    }
    if (ingredients.length === 0) {
      this.formError.set('Добавьте хотя бы один компонент.');
      return;
    }
    if (steps.length === 0) {
      this.formError.set('Добавьте хотя бы один шаг.');
      return;
    }
    const payload = {
      name: d.name.trim(),
      category: d.category,
      description: d.description.trim(),
      difficulty: d.difficulty,
      ingredients,
      steps,
      safetyWarnings,
    };

    if (this.isEdit && this.editingId) {
      const updated = this.recipeService.updateRecipe(this.editingId, payload);
      this.router.navigate(['/recipes', 'detail', updated?.id ?? this.editingId]);
      return;
    }

    const created = this.recipeService.addRecipe(payload);
    this.router.navigate(['/recipes', 'detail', created.id]);
  }
}
