import { Injectable, signal } from '@angular/core';
import { Lesson } from '../models/lesson.model';
import { LESSONS } from '../data/lesson.mock';

@Injectable({ providedIn: 'root' })
export class ClassroomService {
  private lessonsSignal = signal<Lesson[]>(LESSONS);
  
  getLessons() { 
    return this.lessonsSignal.asReadonly(); 
  }
  
  getLessonById(id: string): Lesson | undefined { 
    return this.lessonsSignal().find(l => l.id === id); 
  }
}
