import { Routes } from '@angular/router';

export const SAFETY_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'guide', pathMatch: 'full' },
      { path: 'guide', title: 'Безопасность', loadComponent: () => import('./ui/pages/safety-guide/safety-guide.component').then(m => m.SafetyGuideComponent) },
    ],
  },
];
