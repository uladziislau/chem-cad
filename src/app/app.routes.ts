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
    loadComponent: () => import('./domains/dev/features/dev-layout/dev-layout.component').then(m => m.DevLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full'
      },
      {
        path: 'board',
        loadComponent: () => import('./domains/dev/features/dev-management/dev-management.component').then(m => m.DevManagementComponent)
      },
      {
        path: 'specs',
        loadComponent: () => import('./domains/dev/features/dev-specifications/dev-specifications.component').then(m => m.DevSpecificationsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
