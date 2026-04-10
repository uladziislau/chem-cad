import { Injectable, signal } from '@angular/core';
import { Recipe } from '../models/recipe.model';
import { RECIPES } from '../data/recipe.mock';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private recipesSignal = signal<Recipe[]>(RECIPES);
  
  getRecipes() { 
    return this.recipesSignal.asReadonly(); 
  }
  
  getRecipeById(id: string): Recipe | undefined { 
    return this.recipesSignal().find(r => r.id === id); 
  }
}
