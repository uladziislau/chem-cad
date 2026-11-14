import { Routes } from '@angular/router';

export const RECIPE_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', title: 'Рецепты', loadComponent: () => import('./ui/pages/recipe-list/recipe-list.component').then(m => m.RecipeListComponent) },
      { path: 'detail/:id', title: 'Рецепт', loadComponent: () => import('./ui/pages/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent) },
    ],
  },
];
