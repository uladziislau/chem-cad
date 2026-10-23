import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./domains/lab/features/autarky-hub/autarky-hub.component').then(m => m.AutarkyHubComponent)
  },
  {
    path: 'lab',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./domains/lab/features/lab-dashboard/lab-dashboard.component').then(m => m.LabDashboardComponent)
      },
      {
        path: 'molecule',
        loadComponent: () => import('./domains/lab/features/molecule-explorer/molecule-explorer.component').then(m => m.MoleculeExplorerComponent)
      },
      {
        path: 'process',
        loadComponent: () => import('./domains/lab/features/process-designer/process-designer.component').then(m => m.ProcessDesignerComponent)
      }
    ]
  },
  {
    path: 'dev',
    loadChildren: () => import('./modules/development/development.routes').then(m => m.DEVELOPMENT_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
