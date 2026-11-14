import { Routes } from '@angular/router';

export const LABORATORY_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'virtual', pathMatch: 'full' },
      { path: 'virtual', title: 'Виртуальная лаборатория', loadComponent: () => import('./ui/pages/virtual-lab/virtual-lab.component').then(m => m.VirtualLabComponent) },
    ],
  },
];
