import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ClassroomService } from '../../services/classroom.service';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-slate-900">Учебный класс</h1>
      </div>
      <p class="text-slate-600 text-lg max-w-3xl">
        Интерактивные уроки химии. Проходите теорию и сразу закрепляйте знания на практике в виртуальной лаборатории.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        @for (lesson of lessons(); track lesson.id) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <mat-icon>school</mat-icon>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                {{ lesson.difficulty === 'beginner' ? 'Начальный' : lesson.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый' }}
              </span>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">{{ lesson.title }}</h2>
            <p class="text-slate-600 mb-6 flex-grow">{{ lesson.description }}</p>
            
            <a [routerLink]="['/classroom', lesson.id]" 
               class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-center transition-colors flex items-center justify-center gap-2">
              Начать урок
              <mat-icon class="text-[18px] w-[18px] h-[18px]">play_arrow</mat-icon>
            </a>
          </div>
        }
      </div>
    </div>
  `
})
export class LessonListComponent {
  private classroomService = inject(ClassroomService);
  lessons = this.classroomService.getLessons();
}
