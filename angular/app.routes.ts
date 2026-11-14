import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ui/app/app.entry.page').then(m => m.AppEntryPageComponent)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('@modules/dashboard').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'lab',
    loadChildren: () => import('@modules/lab').then(m => m.LAB_ROUTES)
  },
  {
    path: 'classroom',
    loadChildren: () => import('@modules/classroom').then(m => m.CLASSROOM_ROUTES)
  },
  {
    path: 'quantum',
    loadChildren: () => import('@modules/quantum').then(m => m.QUANTUM_ROUTES)
  },
  {
    path: 'recipes',
    loadChildren: () => import('@modules/recipe').then(m => m.RECIPE_ROUTES)
  },
  {
    path: 'formulator',
    loadChildren: () => import('@modules/formulation').then(m => m.FORMULATION_ROUTES)
  },
  {
    path: 'thermodynamics',
    loadChildren: () => import('@modules/thermodynamics').then(m => m.THERMODYNAMICS_ROUTES)
  },
  {
    path: 'safety',
    loadChildren: () => import('@modules/safety').then(m => m.SAFETY_ROUTES)
  },
  {
    path: 'advanced',
    loadChildren: () => import('@modules/advanced').then(m => m.ADVANCED_ROUTES)
  },
  {
    path: 'architecture',
    loadChildren: () => import('@modules/architecture').then(m => m.ARCHITECTURE_ROUTES)
  },
  {
    path: 'laboratory',
    loadChildren: () => import('@modules/laboratory').then(m => m.LABORATORY_ROUTES)
  },
  {
    path: 'simulator',
    loadChildren: () => import('@modules/simulator').then(m => m.SIMULATOR_ROUTES)
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
