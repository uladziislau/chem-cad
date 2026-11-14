import '@angular/compiler';
import { installMemoryLocalStorage } from '../lab/test-storage';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IngredientCatalogComponent } from '@modules/formulation/ui/pages/ingredient-catalog/ingredient-catalog.component';
import { RecipeService } from '@modules/recipe/services/recipe.service';

describe('IngredientCatalogComponent — usedInRecipes', () => {
  let component: IngredientCatalogComponent;
  let recipeService: RecipeService;

  beforeEach(async () => {
    installMemoryLocalStorage();
    await TestBed.configureTestingModule({
      imports: [IngredientCatalogComponent],
      providers: [provideRouter([])],
    });
    component = TestBed.createComponent(IngredientCatalogComponent).componentInstance;
    recipeService = TestBed.inject(RecipeService);
  });

  it('пусто без выбранного ингредиента', () => {
    expect(component.usedInRecipes()).toEqual([]);
  });

  it('показывает рецепты с выбранным ингредиентом', () => {
    const ingredient = component.ingredients()[0];
    recipeService.addRecipe({
      name: 'Тест', category: 'hygiene', description: '', difficulty: 'easy',
      ingredients: [{ ingredientId: ingredient.id, percentage: 100, purpose: 'x' }],
      steps: [], safetyWarnings: [],
    });
    component.select(ingredient);
    expect(component.usedInRecipes().map(r => r.name)).toContain('Тест');
  });

  it('не показывает рецепты без выбранного ингредиента', () => {
    // propylene_glycol не входит ни в один встроенный рецепт
    const ingredient = component.ingredients().find(i => i.id === 'propylene_glycol')!;
    const other = component.ingredients().find(i => i.id === 'water')!;
    recipeService.addRecipe({
      name: 'Чужой', category: 'hygiene', description: '', difficulty: 'easy',
      ingredients: [{ ingredientId: other.id, percentage: 100, purpose: 'x' }],
      steps: [], safetyWarnings: [],
    });
    component.select(ingredient);
    expect(component.usedInRecipes()).toEqual([]);
  });
});
