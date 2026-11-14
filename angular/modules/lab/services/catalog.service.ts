import { Injectable } from '@angular/core';
import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';
import { ICatalogIngredient, CATALOG_INGREDIENTS } from '../data/catalog-ingredients';

export type { ICatalogIngredient, IngredientCategory, ProductSegment } from '../data/catalog-ingredients';
export { CATALOG_INGREDIENTS };

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly catalog: ICatalogIngredient[] = CATALOG_INGREDIENTS;
  private dynamicIngredients: ICatalogIngredient[] = [];

  getAllIngredients(): ICatalogIngredient[] {
    return [...this.catalog, ...this.dynamicIngredients];
  }

  addIngredient(ingredient: ICatalogIngredient): void {
    this.dynamicIngredients.push(ingredient);
  }

  getIngredientById(id: string): ICatalogIngredient | undefined {
    return this.getAllIngredients().find(ing => ing.id === id);
  }

  findByEntity(entity: IChemicalEntity): ICatalogIngredient | undefined {
    return this.getAllIngredients().find(ing => ing.entity === entity);
  }

  /** Поиск ингредиента по имени entity (для десериализации процессов). */
  findByEntityName(name: string): ICatalogIngredient | undefined {
    const lower = name.toLowerCase();
    return this.getAllIngredients().find(ing =>
      ing.entity.getName().toLowerCase() === lower || ing.name.toLowerCase() === lower
    );
  }
}
