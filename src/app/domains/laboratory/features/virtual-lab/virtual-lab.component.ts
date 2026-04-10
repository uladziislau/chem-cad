import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReactionEngineService } from '../../services/reaction-engine.service';

@Component({
  selector: 'app-virtual-lab',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Виртуальная лаборатория</h1>
        <p class="text-slate-600 mt-2">Инновационный симулятор химических реакций в реальном времени.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Reagents Shelf -->
        <div class="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col h-[600px]">
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <mat-icon class="mr-2 text-indigo-600">shelves</mat-icon>
            Реактивы
          </h2>

          <div class="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label for="reagent-amount" class="block text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-bold">Количество (г/мл)</label>
            <div class="flex items-center gap-2">
              <input id="reagent-amount" type="number" [(ngModel)]="reagentAmount" 
                     class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <span class="text-xs text-slate-400 font-mono">g</span>
            </div>
          </div>

          <div class="overflow-y-auto flex-grow space-y-3 pr-2">
            @for (reagent of availableReagents; track reagent.id) {
              <div class="p-3 border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-slate-50 group"
                   (click)="addReagent(reagent.id)"
                   (keydown.enter)="addReagent(reagent.id)"
                   tabindex="0">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-slate-800">{{ reagent.formula }}</div>
                  <div class="text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-500">
                    {{ reagent.state === 'solid' ? 'Тв.' : reagent.state === 'gas' ? 'Газ' : 'Жидк.' }}
                  </div>
                </div>
                <div class="text-sm text-slate-600 mt-1">{{ reagent.name }}</div>
                <div class="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Добавить {{ reagentAmount }}г
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="lg:col-span-2 bg-slate-900 rounded-2xl shadow-inner border border-slate-800 p-8 relative flex flex-col items-center justify-center min-h-[600px] overflow-hidden">
          
          <!-- Temperature Gauge -->
          <div class="absolute top-6 right-6 bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3 shadow-lg">
            <mat-icon class="text-rose-500">thermostat</mat-icon>
            <div class="text-2xl font-mono text-white">{{ flaskState().temperature }}°C</div>
          </div>

          <!-- Flask Container -->
          <div class="relative w-64 h-80 flex flex-col items-center justify-end transition-transform duration-500"
               [class.scale-110]="flaskState().activeEffect !== 'none'"
               [class.rotate-12]="flaskState().isExploded">
            
            <!-- Explosion Effect -->
            @if (flaskState().isExploded) {
              <div class="absolute inset-0 flex items-center justify-center z-50">
                <div class="w-64 h-64 bg-orange-500 rounded-full blur-3xl opacity-80 animate-ping"></div>
                <mat-icon class="text-8xl text-yellow-300 absolute animate-bounce">local_fire_department</mat-icon>
              </div>
            }

            <!-- Bubbles Effect -->
            @if (flaskState().activeEffect === 'bubbles') {
              <div class="absolute inset-0 overflow-hidden rounded-b-[4rem] z-20 pointer-events-none">
                <div class="absolute bottom-10 left-1/4 w-3 h-3 bg-white rounded-full opacity-70 animate-bounce"></div>
                <div class="absolute bottom-5 left-1/2 w-4 h-4 bg-white rounded-full opacity-60 animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="absolute bottom-15 right-1/3 w-2 h-2 bg-white rounded-full opacity-80 animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            }

            <!-- The Flask SVG -->
            <svg viewBox="0 0 200 250" class="w-full h-full z-10 drop-shadow-2xl">
              <path d="M 80 20 L 120 20 L 120 100 L 180 200 A 30 30 0 0 1 150 240 L 50 240 A 30 30 0 0 1 20 200 L 80 100 Z" 
                    fill="rgba(255,255,255,0.1)" 
                    stroke="rgba(255,255,255,0.5)" 
                    stroke-width="4" />
              <path d="M 40 160 L 160 160 L 180 200 A 30 30 0 0 1 150 240 L 50 240 A 30 30 0 0 1 20 200 Z" 
                    [attr.fill]="flaskState().color" 
                    class="transition-colors duration-1000" />
              <path d="M 40 200 A 20 20 0 0 1 60 180" stroke="rgba(255,255,255,0.4)" stroke-width="4" fill="none" stroke-linecap="round" />
            </svg>
          </div>

          <!-- Controls -->
          <div class="absolute bottom-6 flex gap-4">
            <button (click)="resetFlask()" 
                    class="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-colors border border-slate-600 flex items-center gap-2">
              <mat-icon>delete_sweep</mat-icon>
              Очистить колбу
            </button>
          </div>
        </div>

        <!-- Log Panel -->
        <div class="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col h-[600px]">
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <mat-icon class="mr-2 text-indigo-600">receipt_long</mat-icon>
            Журнал реакций
          </h2>
          <div class="overflow-y-auto flex-grow space-y-3 pr-2 font-mono text-sm">
            @for (log of reactionLog(); track $index) {
              <div class="p-3 rounded-lg" 
                   [class.bg-slate-100]="!log.includes('⚡') && !log.includes('💥')"
                   [class.text-slate-700]="!log.includes('⚡') && !log.includes('💥')"
                   [class.bg-indigo-50]="log.includes('⚡')"
                   [class.text-indigo-800]="log.includes('⚡')"
                   [class.bg-rose-100]="log.includes('💥')"
                   [class.text-rose-800]="log.includes('💥')">
                {{ log }}
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class VirtualLabComponent {
  private engine = inject(ReactionEngineService);
  
  availableReagents = this.engine.getAvailableReagents();
  flaskState = this.engine.flaskState;
  reactionLog = this.engine.reactionLog;
  reagentAmount = 10;

  addReagent(id: string) {
    this.engine.addReagent(id, this.reagentAmount);
  }

  resetFlask() {
    this.engine.resetFlask();
  }
}
