import { Routes } from '@angular/router';

export const QUANTUM_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'atom', pathMatch: 'full' },
      { path: 'atom', title: 'Атом', loadComponent: () => import('./ui/pages/atom-explorer/atom-explorer.component').then(m => m.AtomExplorerComponent) },
      { path: 'bonding', title: 'Связь', loadComponent: () => import('./ui/pages/bonding-arena/bonding-arena.component').then(m => m.BondingArenaComponent) },
    ],
  },
];
