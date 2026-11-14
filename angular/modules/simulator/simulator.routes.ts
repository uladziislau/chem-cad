import { Routes } from '@angular/router';

export const SIMULATOR_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'canvas', pathMatch: 'full' },
      { path: 'canvas', title: 'MD-канвас', loadComponent: () => import('./ui/pages/md-canvas/md-canvas.component').then(m => m.MdCanvasComponent) },
      { path: 'jsme', title: 'JSME', loadComponent: () => import('./ui/pages/jsme-editor/jsme-editor.component').then(m => m.JsmeEditorComponent) },
      { path: 'pro-3d', title: '3D (Pro)', loadComponent: () => import('./ui/pages/pro-3d-viewer/pro-3d-viewer.component').then(m => m.Pro3DViewerComponent) },
      { path: 'vmd', title: 'VMD', loadComponent: () => import('./ui/pages/vmd-3d/vmd-3d.component').then(m => m.Vmd3dComponent) },
    ],
  },
];
