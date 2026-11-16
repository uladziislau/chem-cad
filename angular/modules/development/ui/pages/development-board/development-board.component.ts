import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  developmentCore,
  Epic,
  DevTask,
  EpicStatus,
  DevTaskStatus,
} from '@root-modules/development';

/** Канонические статусы эпика → подпись и класс бейджа. */
const EPIC_STATUS_LABEL: Record<EpicStatus, string> = {
  backlog: 'В планах',
  in_progress: 'В работе',
  done: 'Завершено',
};

const EPIC_STATUS_CLASS: Record<EpicStatus, string> = {
  backlog: 'bg-slate-500/20 text-slate-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  done: 'bg-emerald-500/20 text-emerald-400',
};

/** Канонический конвейер задачи → подпись. */
const TASK_STATUS_LABEL: Record<DevTaskStatus, string> = {
  backlog: 'Бэклог',
  design: 'Дизайн',
  implementation: 'Реализация',
  testing: 'Тестирование',
  review: 'Ревью',
  done: 'Готово',
};

const TASK_STATUS_CLASS: Record<DevTaskStatus, string> = {
  backlog: 'text-slate-500',
  design: 'text-sky-400',
  implementation: 'text-amber-400',
  testing: 'text-violet-400',
  review: 'text-fuchsia-400',
  done: 'text-emerald-400',
};

@Component({
  selector: 'app-development-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './development-board.component.html',
  styleUrl: './development-board.component.css'
})
export class DevelopmentBoardComponent {
  viewMode = signal<'active' | 'archive'>('active');

  /** Эпики канонической модели: directionId/order/status из modules/development. */
  readonly epics: Epic[] = developmentCore.epics;

  /** Задачи эпика — из канонического DevTask.epicId (через сервис). */
  tasksOf(epic: Epic): DevTask[] {
    return developmentCore.getTasksByEpic(epic.id);
  }

  epicStatusLabel(status: EpicStatus): string {
    return EPIC_STATUS_LABEL[status];
  }

  epicStatusClass(status: EpicStatus): string {
    return EPIC_STATUS_CLASS[status];
  }

  taskStatusLabel(status: DevTaskStatus): string {
    return TASK_STATUS_LABEL[status];
  }

  taskStatusClass(status: DevTaskStatus): string {
    return TASK_STATUS_CLASS[status];
  }

  /** Активные эпики — всё, что не done. */
  get activeEpics(): Epic[] {
    return this.epics.filter((e) => e.status !== 'done');
  }

  /** Архив — завершённые эпики. */
  get archivedEpics(): Epic[] {
    return this.epics.filter((e) => e.status === 'done');
  }

  visibleEpics(): Epic[] {
    return this.viewMode() === 'active' ? this.activeEpics : this.archivedEpics;
  }
}
