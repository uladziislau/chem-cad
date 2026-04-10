import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BondingEngineService } from '../../services/bonding-engine.service';
import { BondVisualizerComponent } from '../../ui/bond-visualizer/bond-visualizer.component';

@Component({
  selector: 'app-bonding-arena',
  standalone: true,
  imports: [MatIconModule, BondVisualizerComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
            <mat-icon>compare_arrows</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Арена связей</h1>
        </div>
        <p class="text-lg text-slate-600 max-w-3xl">
          Химия — это перетягивание каната. Выберите два атома и посмотрите, как они делят электроны. 
          Сила, с которой атом тянет электроны на себя, называется <strong>электроотрицательностью (ЭО)</strong>.
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Controls & Visualizer -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- Selectors -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Атом слева</span>
              <div class="flex flex-wrap gap-2">
                @for (el of engine.availableElements; track el.atomicNumber) {
                  <button (click)="engine.setAtomA(el.atomicNumber)"
                          [class.ring-2]="engine.atomA().atomicNumber === el.atomicNumber"
                          [class.ring-indigo-500]="engine.atomA().atomicNumber === el.atomicNumber"
                          [style.backgroundColor]="el.color"
                          class="w-10 h-10 rounded-lg font-mono font-bold shadow-sm hover:scale-110 transition-transform">
                    {{ el.symbol }}
                  </button>
                }
              </div>
            </div>

            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span class="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Атом справа</span>
              <div class="flex flex-wrap gap-2">
                @for (el of engine.availableElements; track el.atomicNumber) {
                  <button (click)="engine.setAtomB(el.atomicNumber)"
                          [class.ring-2]="engine.atomB().atomicNumber === el.atomicNumber"
                          [class.ring-indigo-500]="engine.atomB().atomicNumber === el.atomicNumber"
                          [style.backgroundColor]="el.color"
                          class="w-10 h-10 rounded-lg font-mono font-bold shadow-sm hover:scale-110 transition-transform">
                    {{ el.symbol }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Visualizer -->
          <app-bond-visualizer 
            [atomA]="engine.atomA()" 
            [atomB]="engine.atomB()" 
            [result]="engine.bondResult()">
          </app-bond-visualizer>

        </div>

        <!-- Right Column: Explanation -->
        <div class="flex flex-col gap-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
            
            <div class="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4"
                 [class.bg-slate-100]="engine.bondResult().type === 'none'"
                 [class.text-slate-700]="engine.bondResult().type === 'none'"
                 [class.bg-emerald-100]="engine.bondResult().type === 'covalent-nonpolar'"
                 [class.text-emerald-700]="engine.bondResult().type === 'covalent-nonpolar'"
                 [class.bg-amber-100]="engine.bondResult().type === 'covalent-polar'"
                 [class.text-amber-700]="engine.bondResult().type === 'covalent-polar'"
                 [class.bg-rose-100]="engine.bondResult().type === 'ionic'"
                 [class.text-rose-700]="engine.bondResult().type === 'ionic'">
              
              @switch (engine.bondResult().type) {
                @case ('none') { Нет связи }
                @case ('covalent-nonpolar') { Неполярная ковалентная }
                @case ('covalent-polar') { Полярная ковалентная }
                @case ('ionic') { Ионная связь }
              }
            </div>

            <h3 class="text-xl font-bold text-slate-900 mb-4">Анализ взаимодействия</h3>
            
            <p class="text-slate-600 leading-relaxed mb-6">
              {{ engine.bondResult().description }}
            </p>

            <div class="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 class="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <mat-icon class="text-[18px] w-[18px] h-[18px]">rule</mat-icon>
                Закон природы
              </h4>
              <p class="text-sm text-indigo-800 leading-relaxed">
                Атомы не "хотят" отдавать электроны. Они подчиняются электростатике. 
                Разница в электроотрицательности (ΔEN) определяет судьбу электрона.
                Если ΔEN > 1.7, сильный атом полностью отрывает электрон. Если меньше — они вынуждены делиться.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class BondingArenaComponent {
  engine = inject(BondingEngineService);
}
