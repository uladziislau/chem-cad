import { Routes } from '@angular/router';

export const CLASSROOM_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'lessons', pathMatch: 'full' },
      { path: 'lessons', title: 'Уроки', loadComponent: () => import('./ui/pages/lesson-list/lesson-list.component').then(m => m.LessonListComponent) },
      { path: 'lesson/:id', title: 'Интерактивный урок', loadComponent: () => import('./ui/pages/interactive-lesson/interactive-lesson.component').then(m => m.InteractiveLessonComponent) },
    ],
  },
];
