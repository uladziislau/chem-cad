import { Routes } from '@angular/router';

export const ADVANCED_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'viewer', pathMatch: 'full' },
      { path: 'viewer', title: '3D-просмотр', loadComponent: () => import('./ui/pages/molecular-viewer/molecular-viewer.component').then(m => m.MolecularViewerComponent) },
    ],
  },
];
