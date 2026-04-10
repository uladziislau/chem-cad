import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { FormulationStateService } from '../../services/formulation-state.service';
import { AutarkyService } from '../../../shared/services/autarky.service';
import { MicroscopeViewComponent } from './microscope-view.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MicroscopeViewComponent, RouterLink],
  template: `
    <div class="h-[calc(100vh-8rem)] grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <!-- Left Panel: Catalog -->
      <div class="col-span-3 bg-slate-900/50 border border-white/5 rounded-3xl p-4 flex flex-col h-full overflow-hidden">
        <div class="flex justify-between items-center mb-4 px-2">
          <h2 class="text-lg font-bold text-white">Каталог</h2>
          <a routerLink="/" class="text-[10px] uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Хаб
          </a>
        </div>
        
        <div class="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          @for (ing of filteredIngredients(); track ing.id) {
            <div class="p-3 bg-slate-950/50 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all group">
              <div class="flex justify-between items-start mb-1">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      [class.bg-blue-500/10]="ing.category === 'water'" [class.text-blue-400]="ing.category === 'water'"
                      [class.bg-amber-500/10]="ing.category === 'oil'" [class.text-amber-400]="ing.category === 'oil'"
                      [class.bg-emerald-500/10]="ing.category === 'surfactant'" [class.text-emerald-400]="ing.category === 'surfactant'"
                      [class.bg-purple-500/10]="ing.category === 'thickener'" [class.text-purple-400]="ing.category === 'thickener'">
                  {{ ing.category }}
                </span>
                <button (click)="state.addIngredient(ing)" class="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <h3 class="text-sm font-bold text-slate-200">{{ ing.name }}</h3>
              <p class="text-[10px] font-mono text-slate-500 truncate">{{ ing.inci }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Center Panel: Formulation -->
      <div class="col-span-6 bg-slate-900/30 border border-white/5 rounded-3xl p-6 flex flex-col h-full">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Текущая Рецептура</h2>
          <div class="flex items-center gap-4">
            <!-- Process Designer Link -->
            <a routerLink="/lab/process" 
               class="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Техпроцесс
            </a>

            <!-- Save as Premix Button -->
            <button (click)="savePremix()" 
                    [disabled]="state.items().length === 0"
                    class="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              В каталог
            </button>

            <!-- Process Controls -->
            <div class="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="number" [ngModel]="state.mixerRpm()" (ngModelChange)="state.mixerRpm.set($event)" 
                     class="w-16 bg-transparent text-white text-sm font-bold text-right outline-none" min="0" max="20000" step="100">
              <span class="text-[10px] text-slate-500 uppercase">RPM</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input type="number" [ngModel]="state.mixingTimeMinutes()" (ngModelChange)="state.mixingTimeMinutes.set($event)" 
                     class="w-12 bg-transparent text-white text-sm font-bold text-right outline-none" min="0" max="120">
              <span class="text-[10px] text-slate-500 uppercase">Мин</span>
            </div>
            <div class="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5">
              <span class="text-xs text-slate-400">T:</span>
              <input type="number" [ngModel]="state.targetTemperature()" (ngModelChange)="state.setTemperature($event)" 
                     class="w-12 bg-transparent text-white text-sm font-bold text-right outline-none" min="0" max="100">
              <span class="text-xs text-slate-400">°C</span>
            </div>
          </div>
        </div>

        @if (state.items().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p>Добавьте ингредиенты из каталога слева</p>
          </div>
        } @else {
          <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            @for (item of state.items(); track item.id) {
              <div class="flex items-center gap-4 p-4 bg-slate-900/80 border border-white/5 rounded-2xl">
                <div class="flex-1">
                  <h3 class="text-sm font-bold text-white">{{ item.ingredient.name }}</h3>
                  <p class="text-xs text-slate-500">{{ item.ingredient.inci }}</p>
                </div>
                
                <div class="flex items-center gap-3 w-1/3">
                  <input type="range" [ngModel]="item.massGrams" (ngModelChange)="state.updateMass(item.id, $event)" 
                         min="0" max="100" step="0.1" class="flex-1 accent-indigo-500">
                  <div class="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-white/10 w-20">
                    <input type="number" [ngModel]="item.massGrams" (ngModelChange)="state.updateMass(item.id, $event)" 
                           class="w-full bg-transparent text-white text-sm font-mono text-right outline-none">
                    <span class="text-xs text-slate-500">г</span>
                  </div>
                </div>

                <button (click)="state.removeIngredient(item.id)" class="text-slate-500 hover:text-rose-400 transition-colors p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Right Panel: Physical Monitor -->
      <div class="col-span-3 bg-indigo-950/20 border border-indigo-500/10 rounded-3xl p-6 flex flex-col h-full">
        <h2 class="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Физический Монитор
        </h2>

        <div class="space-y-4">
          <!-- Mass & Cost -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Общая масса</div>
              <div class="text-xl font-mono text-white">{{ state.totalMass() | number:'1.1-2' }} <span class="text-sm text-slate-500">г</span></div>
            </div>
            <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Себестоимость</div>
              <div class="text-xl font-mono text-emerald-400">\${{ state.totalCostPerKg() | number:'1.2-2' }} <span class="text-sm text-slate-500">/кг</span></div>
            </div>
          </div>

          <!-- Solvers Output -->
          <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-4">
            
            <!-- Microscope View -->
            <div>
              <div class="flex justify-between items-end mb-2">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Микроструктура (Microscope)</div>
                <div class="text-sm font-mono text-white">d32: {{ state.system() ? (state.system()!.getDropletSize() | number:'1.1-1') : '0' }} µm</div>
              </div>
              <app-microscope-view [system]="state.system()"></app-microscope-view>
            </div>

            <div>
              <div class="flex justify-between items-end mb-1">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Вязкость (Viscosity)</div>
                <div class="text-sm font-mono text-white">{{ state.viscosity() | number:'1.1-2' }} cP</div>
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 rounded-full" [style.width.%]="Math.min(state.viscosity() / 10, 100)"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-end mb-1">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Стабильность (Shelf Life)</div>
                <div class="text-sm font-mono text-white">{{ state.stabilityDays() > 700 ? '> 2 лет' : (state.stabilityDays() | number:'1.0-0') + ' дней' }}</div>
              </div>
              <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full" 
                     [class.bg-emerald-500]="state.stabilityDays() > 365"
                     [class.bg-amber-500]="state.stabilityDays() <= 365 && state.stabilityDays() > 30"
                     [class.bg-rose-500]="state.stabilityDays() <= 30"
                     [style.width.%]="Math.min(state.stabilityDays() / 730 * 100, 100)"></div>
              </div>
            </div>

            <!-- Miscibility Report -->
            @if (state.miscibilityReport()) {
              <div class="mt-4 p-3 rounded-xl border"
                   [class.bg-emerald-950/30]="state.miscibilityReport()!.isMiscible"
                   [class.border-emerald-500/20]="state.miscibilityReport()!.isMiscible"
                   [class.bg-rose-950/30]="!state.miscibilityReport()!.isMiscible"
                   [class.border-rose-500/20]="!state.miscibilityReport()!.isMiscible">
                <div class="flex justify-between items-center mb-1">
                  <div class="text-[10px] uppercase font-bold"
                       [class.text-emerald-400]="state.miscibilityReport()!.isMiscible"
                       [class.text-rose-400]="!state.miscibilityReport()!.isMiscible">
                    Термодинамика (Hansen)
                  </div>
                  <div class="text-xs font-mono text-white">RED: {{ state.miscibilityReport()!.redScore | number:'1.2-2' }}</div>
                </div>
                <div class="text-xs text-slate-300">{{ state.miscibilityReport()!.message }}</div>
              </div>
            }
            
            <div>
              <div class="flex justify-between items-end mb-1">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Энтальпия (Enthalpy)</div>
                <div class="text-sm font-mono text-white">{{ state.enthalpy() | number:'1.1-2' }} J</div>
              </div>
            </div>

            <!-- pH & Ionic Strength -->
            <div class="pt-2 border-t border-white/5 grid grid-cols-2 gap-4">
              <div>
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">pH Баланс</div>
                <div class="flex items-center gap-2">
                  <div class="text-lg font-mono font-bold" 
                       [class.text-emerald-400]="state.ph() >= 4.5 && state.ph() <= 5.5"
                       [class.text-amber-400]="(state.ph() < 4.5 && state.ph() >= 3.5) || (state.ph() > 5.5 && state.ph() <= 7.5)"
                       [class.text-rose-400]="state.ph() < 3.5 || state.ph() > 7.5">
                    {{ state.ph() | number:'1.1-1' }}
                  </div>
                  <div class="flex gap-0.5 h-2 items-end">
                    @for (i of [1,2,3,4,5,6,7]; track i) {
                      <div class="w-1 rounded-full bg-slate-800" 
                           [class.bg-indigo-500]="Math.round(state.ph() / 2) >= i"></div>
                    }
                  </div>
                </div>
              </div>
              <div>
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Ионная сила</div>
                <div class="text-lg font-mono text-blue-400 font-bold">
                  {{ state.ionicStrength() | number:'1.2-2' }} <span class="text-[10px] text-slate-500">M</span>
                </div>
              </div>
            </div>

            <!-- HLD & HLB -->
            <div class="pt-2 border-t border-white/5 space-y-3">
              <div class="flex justify-between items-center">
                <div class="text-[10px] text-slate-500 uppercase font-bold">Эмульсионный баланс</div>
                <div class="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] text-indigo-300 font-bold">
                  {{ state.emulsionType() }}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] text-slate-500">HLD</span>
                    <span class="text-xs font-mono" 
                          [class.text-amber-400]="Math.abs(state.hld()) < 0.5"
                          [class.text-white]="Math.abs(state.hld()) >= 0.5">
                      {{ state.hld() | number:'1.2-2' }}
                    </span>
                  </div>
                  <div class="h-1 w-full bg-slate-800 rounded-full relative overflow-hidden">
                    <div class="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"></div>
                    <div class="h-full absolute top-0" 
                         [class.bg-blue-500]="state.hld() < 0"
                         [class.bg-orange-500]="state.hld() > 0"
                         [style.left.%]="state.hld() < 0 ? Math.max(0, 50 + state.hld() * 10) : 50"
                         [style.width.%]="Math.min(Math.abs(state.hld()) * 10, 50)"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-slate-600 mt-1 uppercase">
                    <span>O/W</span>
                    <span>W/O</span>
                  </div>
                </div>

                <div class="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-[10px] text-slate-500">HLB</span>
                    <span class="text-xs font-mono text-white">{{ state.actualHLB() | number:'1.1-1' }}</span>
                  </div>
                  <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-400" [style.width.%]="(state.actualHLB() / 20) * 100"></div>
                  </div>
                  <div class="flex justify-between text-[8px] text-slate-600 mt-1 uppercase">
                    <span>Lipid</span>
                    <span>Hydro</span>
                  </div>
                </div>
              </div>

              @if (Math.abs(state.hld()) < 0.5 && state.actualHLB() > 0) {
                <div class="text-[10px] text-amber-500/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  ⚠️ HLD близок к нулю. Риск коалесценции макроэмульсии. Возможна фаза микроэмульсии.
                </div>
              }
            </div>

            @if (state.system() && state.system()!.boundaries.length > 0) {
              <div class="pt-2 border-t border-white/5">
                <div class="flex justify-between items-end mb-1">
                  <div class="text-[10px] text-slate-500 uppercase font-bold" title="Межфазное натяжение">Натяжение (IFT)</div>
                  <div class="text-sm font-mono text-white">{{ state.system()!.boundaries[0].getInterfacialTension() | number:'1.1-2' }} мН/м</div>
                </div>
                <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-400 rounded-full" [style.width.%]="Math.min(state.system()!.boundaries[0].getInterfacialTension() / 50 * 100, 100)"></div>
                </div>
              </div>
            }
          </div>
          
          <!-- HLB Analysis -->
          <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5 space-y-3">
            <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Анализ HLB (Баланс ПАВ)</div>
            
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Требуемый HLB:</span>
              <span class="text-white font-mono">{{ state.requiredHLB() | number:'1.1-1' }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Фактический HLB:</span>
              <span class="text-indigo-400 font-bold font-mono">{{ state.actualHLB() | number:'1.1-1' }}</span>
            </div>

            <div class="relative h-4 bg-slate-800 rounded-full overflow-hidden flex items-center">
              <!-- Required HLB Marker -->
              <div class="absolute h-full w-0.5 bg-white z-10 shadow-[0_0_8px_white]" 
                   [style.left.%]="state.requiredHLB() / 20 * 100"></div>
              
              <!-- Actual HLB Bar -->
              <div class="h-full bg-indigo-500 transition-all duration-500" 
                   [style.width.%]="state.actualHLB() / 20 * 100"></div>
            </div>

            @if (state.items().length > 0) {
              <div class="p-2 rounded-lg text-[10px] leading-tight" 
                   [class.bg-emerald-500/10]="state.hlbMismatch() < 1" [class.text-emerald-400]="state.hlbMismatch() < 1"
                   [class.bg-amber-500/10]="state.hlbMismatch() >= 1 && state.hlbMismatch() < 3" [class.text-amber-400]="state.hlbMismatch() >= 1 && state.hlbMismatch() < 3"
                   [class.bg-rose-500/10]="state.hlbMismatch() >= 3" [class.text-rose-400]="state.hlbMismatch() >= 3">
                @if (state.hlbMismatch() < 1) {
                  <span class="font-bold">✓ Идеальный баланс.</span> Эмульсия химически стабильна.
                } @else if (state.hlbMismatch() < 3) {
                  <span class="font-bold">! Небольшой дисбаланс.</span> Рекомендуется уточнить дозировку ПАВ.
                } @else {
                  <span class="font-bold">✘ Критический дисбаланс.</span> Риск быстрого расслоения! 
                  {{ state.actualHLB() < state.requiredHLB() ? 'Добавьте более гидрофильный ПАВ.' : 'Добавьте более липофильный ПАВ.' }}
                }
              </div>
            }
          </div>
          
          <!-- Phase State -->
          <div class="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
            <div class="text-[10px] text-indigo-400 uppercase font-bold mb-2">Состояние системы</div>
            <div class="text-sm text-slate-300">
              @if (!state.system()) {
                Система пуста
              } @else {
                <div class="flex flex-col gap-1">
                  <div class="flex justify-between items-center">
                    <span>
                      {{ state.system()!.phases.length === 1 ? 'Раствор' : 'Эмульсия' }}
                      @if (state.system()!.phases.length > 1 && state.system()!.getEmulsionType() !== 'Unknown') {
                        <span class="text-indigo-300 font-mono ml-1">[{{ state.system()!.getEmulsionType() }}]</span>
                      }
                    </span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {{ state.system()!.phases.length }} фазы
                    </span>
                  </div>
                  
                  @for (phase of state.system()!.phases; track $index) {
                    <div class="flex justify-between items-center text-xs mt-1">
                      <span class="text-slate-500">Фаза {{ $index === 0 ? 'A (Вода)' : 'B (Масло)' }}:</span>
                      @if (phase.isSolid()) {
                        <span class="text-rose-400 flex items-center gap-1 font-bold">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Застыла
                        </span>
                      } @else {
                        <span class="text-emerald-400">Жидкая</span>
                      }
                    </div>
                  }

                  @if (state.solubilityIssues().length > 0) {
                    <div class="mt-2 pt-2 border-t border-indigo-500/20">
                      <div class="text-[10px] text-rose-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Осадок (Кристаллизация)
                      </div>
                      @for (issue of state.solubilityIssues(); track issue.entityName) {
                        <div class="flex justify-between items-center text-xs mt-1">
                          <span class="text-slate-400">{{ issue.entityName }}</span>
                          <span class="text-rose-400 font-mono font-bold">+{{ issue.excessMass | number:'1.1-2' }} г</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Safety Monitor -->
          @if (state.safetyIssues().length > 0) {
            <div class="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-3">
              <div class="flex items-center gap-2 text-rose-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 class="text-sm font-bold uppercase tracking-wider">Безопасность</h2>
              </div>
              
              <div class="space-y-2">
                @for (issue of state.safetyIssues(); track issue.code) {
                  <div class="p-2 rounded-lg bg-slate-950/50 border border-white/5">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="w-2 h-2 rounded-full" 
                            [class.bg-rose-500]="issue.level === 'critical' || issue.level === 'error'"
                            [class.bg-amber-500]="issue.level === 'warning'"
                            [class.bg-blue-500]="issue.level === 'info'"></span>
                      <span class="text-[10px] font-bold text-white uppercase">{{ issue.title }}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 leading-tight">{{ issue.message }}</p>
                  </div>
                }
              </div>
            </div>
          }
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
export class LabDashboardComponent {
  catalog = inject(CatalogService);
  state = inject(FormulationStateService);
  autarky = inject(AutarkyService);
  Math = Math;

  filteredIngredients = computed(() => {
    const segment = this.autarky.selectedSegment();
    const all = this.catalog.getAllIngredients();
    if (!segment) return all;
    return all.filter(ing => ing.segments.includes(segment));
  });

  savePremix() {
    const name = prompt('Введите название премикса (базы):', 'Новая база');
    if (name) {
      this.state.saveAsPremix(name);
    }
  }
}
