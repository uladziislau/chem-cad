import { Injectable, signal } from '@angular/core';
import { Ingredient } from '../models/ingredient.model';
import { INGREDIENTS } from '../data/ingredient.mock';

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private ingredientsSignal = signal<Ingredient[]>(INGREDIENTS);
  
  getIngredients() { 
    return this.ingredientsSignal.asReadonly(); 
  }
  
  getIngredientById(id: string): Ingredient | undefined { 
    return this.ingredientsSignal().find(i => i.id === id); 
  }
}
