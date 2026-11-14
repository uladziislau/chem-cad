import { Routes } from '@angular/router';

export const FORMULATION_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'formulator', pathMatch: 'full' },
      { path: 'formulator', title: 'Формулятор', loadComponent: () => import('./ui/pages/formulator/formulator.component').then(m => m.FormulatorComponent) },
      { path: 'ingredients', title: 'Каталог ингредиентов', loadComponent: () => import('./ui/pages/ingredient-catalog/ingredient-catalog.component').then(m => m.IngredientCatalogComponent) },
    ],
  },
];
