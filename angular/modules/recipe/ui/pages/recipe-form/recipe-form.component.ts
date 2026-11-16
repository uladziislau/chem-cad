import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeService } from '@modules/recipe/services/recipe.service';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { Recipe, RecipeIngredient, RecipeStep } from '@root-modules/recipe/models/recipe.model';

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

interface DraftStep extends RecipeStep {
  /** ключ строки для trackBy */
  rowId: number;
  /** временный выбор ингредиента в UI (не сохраняется) */
  pickIngredientId: string;
}

interface Draft {
  name: string;
  category: Category;
  difficulty: Difficulty;
  description: string;
  ingredients: DraftIngredient[];
  steps: DraftStep[];
  safetyWarnings: string[];
}

let rowSeq = 0;

function emptyIngredient(): DraftIngredient {
  return { rowId: ++rowSeq, ingredientId: '', percentage: 0, purpose: '' };
}

function emptyStep(): DraftStep {
  return { rowId: ++rowSeq, text: '', ingredientIds: [], pickIngredientId: '', durationMinutes: undefined };
}

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './recipe-form.component.html',
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
    steps: [emptyStep()],
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
      steps: recipe.steps.length
        ? recipe.steps.map(s => ({
            ...s,
            rowId: ++rowSeq,
            ingredientIds: [...(s.ingredientIds ?? [])],
            pickIngredientId: '',
          }))
        : [emptyStep()],
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
      && this.draft.steps.some(s => s.text.trim().length > 0);
  }

  ingredientName(id: string): string {
    return this.ingredientService.getIngredientById(id)?.name ?? id;
  }

  addIngredient(): void {
    this.draft.ingredients.push(emptyIngredient());
  }

  removeIngredient(rowId: number): void {
    this.draft.ingredients = this.draft.ingredients.filter(i => i.rowId !== rowId);
  }

  addStep(): void {
    this.draft.steps.push(emptyStep());
  }

  removeStep(index: number): void {
    this.draft.steps.splice(index, 1);
  }

  addStepIngredient(step: DraftStep): void {
    const id = step.pickIngredientId;
    if (!id) return;
    step.ingredientIds = [...(step.ingredientIds ?? []), id];
    step.pickIngredientId = '';
  }

  removeStepIngredient(step: DraftStep, id: string): void {
    step.ingredientIds = (step.ingredientIds ?? []).filter(x => x !== id);
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
    const steps: RecipeStep[] = d.steps
      .filter(s => s.text.trim().length > 0)
      .map(s => {
        const step: RecipeStep = { text: s.text.trim() };
        const ids = (s.ingredientIds ?? []).filter(Boolean);
        if (ids.length) step.ingredientIds = ids;
        const dur = Number(s.durationMinutes);
        if (Number.isFinite(dur) && dur > 0) step.durationMinutes = dur;
        return step;
      });
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
