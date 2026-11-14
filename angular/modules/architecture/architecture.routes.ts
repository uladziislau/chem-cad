import { Routes } from '@angular/router';

export const ARCHITECTURE_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'sandbox', pathMatch: 'full' },
      { path: 'sandbox', title: 'OOP-песочница', loadComponent: () => import('./ui/pages/oop-sandbox/oop-sandbox.component').then(m => m.OopSandboxComponent) },
    ],
  },
];
