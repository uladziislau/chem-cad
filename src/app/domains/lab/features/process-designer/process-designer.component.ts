import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessStateService } from '../../services/process-state.service';
import { CatalogService, ICatalogIngredient } from '../../services/catalog.service';
import { RouterLink } from '@angular/router';
import { MicroscopeViewComponent } from '../lab-dashboard/microscope-view.component';
import { OperationType } from '../../../../../core/engine/process-step.interface';

@Component({
  selector: 'app-process-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MicroscopeViewComponent],
  template: `
    <div class="h-[calc(100vh-8rem)] grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <!-- Left Panel: Process Steps -->
      <div class="col-span-3 bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex flex-col h-full overflow-hidden">
        <div class="flex justify-between items-center mb-4 px-2">
          <h2 class="text-lg font-bold text-white">Техпроцесс</h2>
          <div class="flex gap-2">
             <button (click)="addStep('ADD')" class="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors" title="Добавить компоненты">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
             </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          @for (step of process.currentProcess().steps; track step.id; let i = $index) {
            <div (click)="process.activeStepIndex.set(i)"
                 class="p-3 border rounded-xl cursor-pointer transition-all group relative"
                 [class.bg-indigo-500/10]="process.activeStepIndex() === i"
                 [class.border-indigo-500/50]="process.activeStepIndex() === i"
                 [class.bg-slate-950/50]="process.activeStepIndex() !== i"
                 [class.border-white/5]="process.activeStepIndex() !== i">
              
              <div class="flex justify-between items-start mb-1">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Шаг {{ i + 1 }}</span>
                <button (click)="process.removeStep(step.id); $event.stopPropagation()" 
                        class="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <h3 class="text-sm font-bold" [class.text-white]="process.activeStepIndex() === i" [class.text-slate-400]="process.activeStepIndex() !== i">
                {{ step.name }}
              </h3>
              
              <div class="flex gap-2 mt-2">
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{{ step.operation }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{{ step.durationMinutes }} мин</span>
              </div>
            </div>
          }

          <div class="grid grid-cols-2 gap-2 mt-4">
            <button (click)="addStep('MIX')" class="text-[10px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors uppercase font-bold">Перемешать</button>
            <button (click)="addStep('HEAT')" class="text-[10px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors uppercase font-bold">Нагреть</button>
            <button (click)="addStep('COOL')" class="text-[10px] p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors uppercase font-bold">Охладить</button>
            <button (click)="addStep('EMULSIFY')" class="text-[10px] p-2 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 rounded-lg transition-colors uppercase font-bold border border-indigo-500/20">Эмульгировать</button>
          </div>
        </div>
      </div>

      <!-- Center Panel: Step Details -->
      <div class="col-span-6 bg-slate-900/30 border border-white/5 rounded-3xl p-6 flex flex-col h-full overflow-hidden">
        @if (activeStep(); as step) {
          <div class="flex justify-between items-start mb-6">
            <div>
              <input [ngModel]="step.name" (ngModelChange)="process.updateStep(step.id, {name: $event})"
                     class="text-2xl font-bold bg-transparent text-white outline-none border-b border-transparent focus:border-indigo-500/50 w-full mb-1">
              <p class="text-sm text-slate-500">Настройка параметров этапа</p>
            </div>
            
            <div class="flex gap-4">
               <div class="text-right">
                 <div class="text-[10px] text-slate-500 uppercase font-bold">Длительность</div>
                 <div class="flex items-center gap-2">
                   <input type="number" [ngModel]="step.durationMinutes" (ngModelChange)="process.updateStep(step.id, {durationMinutes: $event})"
                          class="w-12 bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-sm font-mono outline-none">
                   <span class="text-xs text-slate-500">мин</span>
                 </div>
               </div>
               @if (step.operation !== 'ADD') {
                 <div class="text-right">
                   <div class="text-[10px] text-slate-500 uppercase font-bold">Скорость</div>
                   <div class="flex items-center gap-2">
                     <input type="number" [ngModel]="step.rpm" (ngModelChange)="process.updateStep(step.id, {rpm: $event})"
                            class="w-16 bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-sm font-mono outline-none">
                     <span class="text-xs text-slate-500">RPM</span>
                   </div>
                 </div>
               }
               <div class="text-right">
                 <div class="text-[10px] text-slate-500 uppercase font-bold">Температура</div>
                 <div class="flex items-center gap-2">
                   <input type="number" [ngModel]="step.targetTemperature" (ngModelChange)="process.updateStep(step.id, {targetTemperature: $event})"
                          class="w-12 bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-sm font-mono outline-none">
                   <span class="text-xs text-slate-500">°C</span>
                 </div>
               </div>
            </div>
          </div>

          <!-- Step Content -->
          <div class="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            
            <!-- Ingredients for this step -->
            @if (step.operation === 'ADD') {
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                   <h3 class="text-sm font-bold text-white uppercase tracking-wider">Добавляемые компоненты</h3>
                   <button (click)="showCatalog = !showCatalog" class="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                     {{ showCatalog ? 'Закрыть каталог' : '+ Добавить из каталога' }}
                   </button>
                </div>

                @if (showCatalog) {
                  <div class="grid grid-cols-2 gap-2 p-4 bg-slate-950/50 rounded-2xl border border-white/5 animate-in zoom-in-95 duration-300">
                    @for (ing of catalog.getAllIngredients(); track ing.id) {
                      <button (click)="addIngredientToStep(step.id, ing)" 
                              class="text-left p-2 hover:bg-white/5 rounded-lg transition-colors group">
                        <div class="text-xs font-bold text-slate-300 group-hover:text-white">{{ ing.name }}</div>
                        <div class="text-[10px] text-slate-500">{{ ing.inci }}</div>
                      </button>
                    }
                  </div>
                }

                <div class="space-y-2">
                  @for (ingInput of step.ingredients || []; track $index) {
                    <div class="flex items-center gap-4 p-3 bg-slate-900/50 border border-white/5 rounded-xl">
                      <div class="flex-1">
                        <div class="text-sm font-bold text-white">{{ ingInput.entity.getName() }}</div>
                        <div class="text-[10px] text-slate-500">{{ ingInput.category }}</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <input type="number" [ngModel]="ingInput.massGrams" 
                               (ngModelChange)="updateIngredientMass(step.id, $index, $event)"
                               class="w-16 bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-sm font-mono text-right outline-none">
                        <span class="text-xs text-slate-500">г</span>
                      </div>
                    </div>
                  } @empty {
                    <div class="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl text-slate-600">
                      Нет компонентов на этом этапе
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Instructions -->
            <div class="space-y-2">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Инструкции</h3>
              <textarea [ngModel]="step.instructions" (ngModelChange)="process.updateStep(step.id, {instructions: $event})"
                        placeholder="Опишите действия для оператора..."
                        class="w-full h-32 bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 outline-none focus:border-indigo-500/30 transition-all resize-none"></textarea>
            </div>
          </div>

        } @else {
          <div class="flex-1 flex flex-col items-center justify-center text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p class="text-lg font-bold">Выберите или создайте этап процесса</p>
          </div>
        }
      </div>

      <!-- Right Panel: State Evolution -->
      <div class="col-span-3 bg-indigo-950/20 border border-indigo-500/10 rounded-3xl p-6 flex flex-col h-full overflow-hidden">
        <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Эволюция Системы
        </h2>

        @if (process.currentStepResult(); as result) {
          <div class="space-y-6 overflow-y-auto custom-scrollbar pr-2">
            
            <!-- Microscope View -->
            <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div class="flex justify-between items-end mb-2">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Микроструктура</div>
                <div class="text-sm font-mono text-white">{{ result.system.getDropletSize() | number:'1.1-1' }} µm</div>
              </div>
              <app-microscope-view [system]="result.system"></app-microscope-view>
            </div>

            <!-- Metrics -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Вязкость</div>
                <div class="text-sm font-mono text-white">{{ result.metrics.viscosity | number:'1.0-0' }} cP</div>
              </div>
              <div class="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">pH</div>
                <div class="text-sm font-mono text-white">{{ result.metrics.ph | number:'1.1-1' }}</div>
              </div>
            </div>

            <!-- Phase Info -->
            <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-3">
              <div class="text-[10px] text-slate-500 uppercase font-bold">Состав фаз</div>
              @for (phase of result.system.phases; track $index) {
                <div class="space-y-1">
                  <div class="flex justify-between text-[10px]">
                    <span class="text-indigo-400 font-bold">Фаза {{ $index === 0 ? 'A' : 'B' }}</span>
                    <span class="text-white">{{ phase.totalMass.to('g') | number:'1.1-1' }} г</span>
                  </div>
                  <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500" [style.width.%]="(phase.totalMass.to('g') / result.system.getTotalMass().to('g')) * 100"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Stability -->
            <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div class="text-[10px] text-slate-500 uppercase font-bold mb-2">Прогноз стабильности</div>
              <div class="text-xl font-mono text-white mb-1">
                {{ result.metrics.stabilityDays > 700 ? '> 2 лет' : (result.metrics.stabilityDays | number:'1.0-0') + ' дней' }}
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full" 
                     [class.bg-emerald-500]="result.metrics.stabilityDays > 365"
                     [class.bg-amber-500]="result.metrics.stabilityDays <= 365 && result.metrics.stabilityDays > 30"
                     [class.bg-rose-500]="result.metrics.stabilityDays <= 30"
                     [style.width.%]="Math.min(result.metrics.stabilityDays / 730 * 100, 100)"></div>
              </div>
            </div>

          </div>
        } @else {
          <div class="flex-1 flex items-center justify-center text-slate-600 text-center p-6 italic text-sm">
            Добавьте этапы процесса, чтобы увидеть эволюцию физических свойств системы
          </div>
        }

        <div class="mt-auto pt-6 border-t border-white/5">
           <a routerLink="/lab/dashboard" class="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all font-bold text-sm">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
             </svg>
             Вернуться в Лабораторию
           </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  `]
})
export class ProcessDesignerComponent {
  process = inject(ProcessStateService);
  catalog = inject(CatalogService);
  Math = Math;

  showCatalog = false;

  activeStep = computed(() => {
    const steps = this.process.currentProcess().steps;
    const index = this.process.activeStepIndex();
    return steps[index] || null;
  });

  addStep(op: OperationType) {
    this.process.addStep(op);
  }

  addIngredientToStep(stepId: string, ingredient: ICatalogIngredient) {
    this.process.addIngredientsToStep(stepId, [{
      entity: ingredient.entity,
      massGrams: 10,
      category: ingredient.category
    }]);
    this.showCatalog = false;
  }

  updateIngredientMass(stepId: string, index: number, mass: number) {
    const step = this.process.currentProcess().steps.find((s: any) => s.id === stepId);
    if (step && step.ingredients) {
      const newIngredients = [...step.ingredients];
      newIngredients[index] = { ...newIngredients[index], massGrams: mass };
      this.process.updateStep(stepId, { ingredients: newIngredients });
    }
  }
}
