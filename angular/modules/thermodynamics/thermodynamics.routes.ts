import { Routes } from '@angular/router';

export const THERMODYNAMICS_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'predictor', pathMatch: 'full' },
      { path: 'predictor', title: 'Предиктор реакций', loadComponent: () => import('./ui/pages/reaction-predictor/reaction-predictor.component').then(m => m.ReactionPredictorComponent) },
    ],
  },
];
