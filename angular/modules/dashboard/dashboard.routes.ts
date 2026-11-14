import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', title: 'Главная', loadComponent: () => import('./ui/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
    ],
  },
];
