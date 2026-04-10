import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ClassroomService } from '../../services/classroom.service';
import { ReactionEngineService } from '../../../laboratory/services/reaction-engine.service';

@Component({
  selector: 'app-interactive-lesson',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    @if (lesson()) {
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <a routerLink="/classroom" class="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1 class="text-3xl font-bold text-slate-900">{{ lesson()?.title }}</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Theory & Steps Panel -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-[600px]">
            <div class="flex-grow overflow-y-auto pr-4 space-y-8">
              
              <div class="prose prose-slate max-w-none">
                <p class="text-lg text-slate-600">{{ lesson()?.description }}</p>
              </div>

              <div class="space-y-6 relative">
                <!-- Progress Line -->
                <div class="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100 -z-10"></div>

                @for (step of lesson()?.steps; track step.id; let i = $index) {
                  <div class="relative pl-12 transition-opacity duration-300"
                       [class.opacity-50]="i > currentStepIndex()"
                       [class.pointer-events-none]="i > currentStepIndex()">
                    
                    <!-- Step Indicator -->
                    <div class="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors"
                         [class.bg-indigo-600]="i === currentStepIndex()"
                         [class.border-indigo-600]="i === currentStepIndex()"
                         [class.text-white]="i === currentStepIndex()"
                         [class.bg-green-500]="i < currentStepIndex()"
                         [class.border-green-500]="i < currentStepIndex()"
                         [class.text-white]="i < currentStepIndex()"
                         [class.bg-white]="i > currentStepIndex()"
                         [class.border-slate-300]="i > currentStepIndex()"
                         [class.text-slate-400]="i > currentStepIndex()">
                      @if (i < currentStepIndex()) {
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">check</mat-icon>
                      } @else {
                        <span class="text-sm font-bold">{{ i + 1 }}</span>
                      }
                    </div>

                    <h3 class="text-lg font-bold text-slate-900 mb-2">{{ step.title }}</h3>
                    <p class="text-slate-700 mb-4">{{ step.content }}</p>

                    @if (i === currentStepIndex() && step.requiredAction) {
                      <div class="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                        <mat-icon class="text-indigo-600 mt-0.5">science</mat-icon>
                        <div>
                          <p class="text-sm font-medium text-indigo-900">Задание:</p>
                          <p class="text-sm text-indigo-800">Найдите нужный реактив на полке справа и добавьте его в колбу.</p>
                        </div>
                      </div>
                    } @else if (i === currentStepIndex() && !step.requiredAction) {
                      <button (click)="nextStep()" class="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                        Понятно, дальше
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">arrow_forward</mat-icon>
                      </button>
                    }

                    @if (i < currentStepIndex() && step.successMessage) {
                      <div class="p-4 bg-green-50 rounded-xl border border-green-100 flex items-start gap-3">
                        <mat-icon class="text-green-600 mt-0.5">check_circle</mat-icon>
                        <p class="text-sm text-green-800">{{ step.successMessage }}</p>
                      </div>
                    }
                  </div>
                }

                @if (isLessonComplete()) {
                  <div class="relative pl-12">
                    <div class="absolute left-0 top-0 w-8 h-8 rounded-full bg-green-500 border-2 border-green-500 text-white flex items-center justify-center">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">emoji_events</mat-icon>
                    </div>
                    <h3 class="text-xl font-bold text-green-600 mb-2">Урок завершен!</h3>
                    <p class="text-slate-700">Вы успешно выполнили все шаги эксперимента.</p>
                    <button (click)="resetLesson()" class="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
                      Начать заново
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Mini Virtual Lab -->
          <div class="bg-slate-900 rounded-2xl shadow-inner border border-slate-800 p-6 flex flex-col h-[600px]">
            
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-white font-semibold flex items-center">
                <mat-icon class="mr-2 text-indigo-400">science</mat-icon>
                Лабораторный стол
              </h2>
              <div class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 flex items-center gap-2">
                <mat-icon class="text-rose-500 text-[18px] w-[18px] h-[18px]">thermostat</mat-icon>
                <span class="font-mono text-white text-sm">{{ flaskState().temperature }}°C</span>
              </div>
            </div>

            <div class="flex-grow flex gap-4">
              <!-- Reagents Mini-Shelf -->
              <div class="w-1/3 bg-slate-800 rounded-xl border border-slate-700 p-2 overflow-y-auto">
                <div class="space-y-2">
                  @for (reagent of availableReagents; track reagent.id) {
                    <button (click)="addReagent(reagent.id)"
                            class="w-full text-left p-2 rounded-lg bg-slate-700 hover:bg-indigo-600 text-white transition-colors border border-slate-600 hover:border-indigo-500 group">
                      <div class="font-mono text-sm font-bold">{{ reagent.formula }}</div>
                      <div class="text-xs text-slate-300 truncate">{{ reagent.name }}</div>
                    </button>
                  }
                </div>
              </div>

              <!-- Flask Area -->
              <div class="w-2/3 relative flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div class="relative w-40 h-48 flex flex-col items-center justify-end transition-transform duration-500"
                     [class.scale-110]="flaskState().activeEffect !== 'none'"
                     [class.rotate-12]="flaskState().isExploded">
                  
                  @if (flaskState().isExploded) {
                    <div class="absolute inset-0 flex items-center justify-center z-50">
                      <div class="w-40 h-40 bg-orange-500 rounded-full blur-2xl opacity-80 animate-ping"></div>
                    </div>
                  }

                  @if (flaskState().activeEffect === 'bubbles') {
                    <div class="absolute inset-0 overflow-hidden rounded-b-[3rem] z-20 pointer-events-none">
                      <div class="absolute bottom-5 left-1/4 w-2 h-2 bg-white rounded-full opacity-70 animate-bounce"></div>
                      <div class="absolute bottom-2 left-1/2 w-3 h-3 bg-white rounded-full opacity-60 animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                  }

                  <svg viewBox="0 0 200 250" class="w-full h-full z-10 drop-shadow-2xl">
                    <path d="M 80 20 L 120 20 L 120 100 L 180 200 A 30 30 0 0 1 150 240 L 50 240 A 30 30 0 0 1 20 200 L 80 100 Z" 
                          fill="rgba(255,255,255,0.05)" 
                          stroke="rgba(255,255,255,0.3)" 
                          stroke-width="4" />
                    <path d="M 40 160 L 160 160 L 180 200 A 30 30 0 0 1 150 240 L 50 240 A 30 30 0 0 1 20 200 Z" 
                          [attr.fill]="flaskState().color" 
                          class="transition-colors duration-1000" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Mini Log -->
            <div class="mt-4 h-24 bg-slate-950 rounded-xl border border-slate-800 p-2 overflow-y-auto font-mono text-xs">
              @for (log of reactionLog(); track $index) {
                <div class="mb-1"
                     [class.text-slate-400]="!log.includes('⚡') && !log.includes('💥')"
                     [class.text-indigo-400]="log.includes('⚡')"
                     [class.text-rose-400]="log.includes('💥')">
                  > {{ log }}
                </div>
              }
            </div>

          </div>
        </div>
      </div>
    } @else {
      <div class="text-center py-12">
        <p class="text-slate-500">Урок не найден.</p>
        <a routerLink="/classroom" class="text-indigo-600 hover:underline mt-4 inline-block">Вернуться к списку</a>
      </div>
    }
  `
})
export class InteractiveLessonComponent {
  private route = inject(ActivatedRoute);
  private classroomService = inject(ClassroomService);
  private engine = inject(ReactionEngineService);
  private params = toSignal(this.route.paramMap);

  lesson = computed(() => {
    const id = this.params()?.get('id');
    return id ? this.classroomService.getLessonById(id) : undefined;
  });

  currentStepIndex = signal(0);
  isLessonComplete = computed(() => {
    const l = this.lesson();
    return !!l && this.currentStepIndex() >= l.steps.length;
  });

  availableReagents = this.engine.getAvailableReagents();
  flaskState = this.engine.flaskState;
  reactionLog = this.engine.reactionLog;

  constructor() {
    this.engine.resetFlask();
  }

  addReagent(id: string) {
    this.engine.addReagent(id);
    this.checkStepProgress(id);
  }

  checkStepProgress(addedReagentId: string) {
    const l = this.lesson();
    if (!l || this.isLessonComplete()) return;

    const currentStep = l.steps[this.currentStepIndex()];
    if (currentStep.requiredAction?.type === 'add_reagent' && currentStep.requiredAction.reagentId === addedReagentId) {
      // Step completed!
      this.currentStepIndex.update(i => i + 1);
    }
  }

  nextStep() {
    const l = this.lesson();
    if (!l || this.isLessonComplete()) return;
    this.currentStepIndex.update(i => i + 1);
  }

  resetLesson() {
    this.currentStepIndex.set(0);
    this.engine.resetFlask();
  }
}
