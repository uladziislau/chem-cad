import { Routes } from '@angular/router';
import { DevelopmentNavigationComponent } from './ui/components/development-navigation/development-navigation.component';

export const DEVELOPMENT_ROUTES: Routes = [
  {
    path: '',
    component: DevelopmentNavigationComponent,
    children: [
      { path: '', redirectTo: 'board', pathMatch: 'full' },
      {
        path: 'board',
        title: 'Управление разработкой',
        loadComponent: () => import('./ui/pages/development-board/development-board.component').then(m => m.DevelopmentBoardComponent)
      },
      {
        path: 'specs',
        title: 'Спецификации разработки',
        loadComponent: () => import('./ui/pages/development-specs/development-specs.component').then(m => m.DevelopmentSpecsComponent)
      }
    ]
  }
];
