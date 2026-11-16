import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { RecipeService } from '@modules/recipe/services/recipe.service';
import { recipesUsingIngredient } from '@root-modules/recipe/recipe-query';
import { Ingredient } from '@root-modules/formulation/models/ingredient.model';
import { downloadJson } from '../../../../download-json';

type IngredientType = Ingredient['type'];

const TYPE_OPTIONS: { value: IngredientType; label: string }[] = [
  { value: 'base', label: 'Основа' },
  { value: 'surfactant', label: 'ПАВ' },
  { value: 'solvent', label: 'Растворитель' },
  { value: 'active', label: 'Активный компонент' },
  { value: 'fragrance', label: 'Отдушка / Эфирное масло' },
  { value: 'preservative', label: 'Консервант' },
  { value: 'additive', label: 'Добавка' },
];

interface Draft {
  name: string;
  type: IngredientType;
  description: string;
  safety: string;
}

const EMPTY_DRAFT: Draft = { name: '', type: 'additive', description: '', safety: '' };

@Component({
  selector: 'app-ingredient-catalog',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ingredient-catalog.component.html',
})
export class IngredientCatalogComponent {
  private ingredientService = inject(IngredientService);
  private recipeService = inject(RecipeService);

  typeOptions = TYPE_OPTIONS;
  ingredients = this.ingredientService.getIngredients();
  recipes = this.recipeService.getRecipes();

  searchText = signal('');
  typeFilter = signal('');
  draft: Draft = { ...EMPTY_DRAFT };
  editingId = signal<string | null>(null);
  editingCustom = signal(false);
  formError = signal<string | null>(null);
  statusMessage = signal<string | null>(null);
  statusOk = signal(true);

  filteredIngredients = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const t = this.typeFilter();
    return this.ingredients().filter(i =>
      (!q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
      && (!t || i.type === t));
  });

  /** Рецепты, в составе которых выбранный ингредиент. */
  usedInRecipes = computed(() => {
    const id = this.editingId();
    return id ? recipesUsingIngredient(this.recipes(), id) : [];
  });

  canSave(): boolean {
    return this.draft.name.trim().length > 0;
  }

  typeLabel(type: string): string {
    return TYPE_OPTIONS.find(t => t.value === type)?.label ?? type;
  }

  select(ingredient: Ingredient): void {
    this.editingId.set(ingredient.id);
    this.editingCustom.set(ingredient.isCustom === true);
    this.formError.set(null);
    this.draft = {
      name: ingredient.name,
      type: ingredient.type,
      description: ingredient.description,
      safety: ingredient.safety,
    };
  }

  resetForm(): void {
    this.editingId.set(null);
    this.editingCustom.set(false);
    this.draft = { ...EMPTY_DRAFT };
    this.formError.set(null);
  }

  save(): void {
    if (!this.canSave()) {
      this.formError.set('Название обязательно');
      return;
    }
    const id = this.editingId();
    if (id) {
      const updated = this.ingredientService.updateIngredient(id, { ...this.draft });
      if (!updated) {
        this.formError.set('Встроенный ингредиент нельзя редактировать');
        return;
      }
      this.flash('Ингредиент обновлён', true);
    } else {
      this.ingredientService.addIngredient({ ...this.draft });
      this.flash('Ингредиент добавлен', true);
    }
    this.resetForm();
  }

  remove(): void {
    const id = this.editingId();
    if (!id) return;
    if (this.ingredientService.removeIngredient(id)) {
      this.flash('Ингредиент удалён', true);
      this.resetForm();
    } else {
      this.formError.set('Удалить можно только свой ингредиент');
    }
  }

  exportAll(): void {
    downloadJson(this.ingredientService.exportIngredients(), 'ingredients.json');
    this.flash('Экспортировано', true);
  }

  exportOne(id: string): void {
    const json = this.ingredientService.exportIngredient(id);
    if (json) {
      downloadJson(json, `ingredient-${id}.json`);
      this.flash('Экспортировано', true);
    }
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    file.text().then(text => {
      const count = this.ingredientService.importIngredients(text);
      this.flash(count > 0 ? `Импортировано ингредиентов: ${count}` : 'Импорт: нет валидных записей', count > 0);
    });
  }

  private flash(message: string, ok: boolean): void {
    this.statusMessage.set(message);
    this.statusOk.set(ok);
  }
}
