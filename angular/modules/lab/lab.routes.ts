import { Routes } from '@angular/router';

export const LAB_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', title: 'Лаборатория', loadComponent: () => import('./ui/pages/lab-dashboard/lab-dashboard.component').then(m => m.LabDashboardComponent) },
      { path: 'molecule', title: 'Молекула', loadComponent: () => import('./ui/pages/molecule-explorer/molecule-explorer.component').then(m => m.MoleculeExplorerComponent) },
      { path: 'process', title: 'Процесс', loadComponent: () => import('./ui/pages/process-designer/process-designer.component').then(m => m.ProcessDesignerComponent) },
    ],
  },
];
