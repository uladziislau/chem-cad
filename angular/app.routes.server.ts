import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Динамические страницы с параметрами — только клиентский рендер
  // (SPA читает данные из сервисов/localStorage, пререндер невозможен).
  {
    path: 'classroom/lesson/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'recipes/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'recipes/detail/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
