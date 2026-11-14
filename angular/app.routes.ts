import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ui/app/app.entry.page').then(m => m.AppEntryPageComponent)
  },
  {
    path: 'lab',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../src/app/domains/lab/features/lab-dashboard/lab-dashboard.component').then(m => m.LabDashboardComponent)
      },
      {
        path: 'molecule',
        loadComponent: () => import('../src/app/domains/lab/features/molecule-explorer/molecule-explorer.component').then(m => m.MoleculeExplorerComponent)
      },
      {
        path: 'process',
        loadComponent: () => import('../src/app/domains/lab/features/process-designer/process-designer.component').then(m => m.ProcessDesignerComponent)
      }
    ]
  },
  {
    path: 'development',
    loadChildren: () => import('@modules/development').then(m => m.DEVELOPMENT_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
