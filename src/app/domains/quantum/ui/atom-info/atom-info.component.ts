import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AtomComputedProperties } from '../../models/atom.model';

@Component({
  selector: 'app-atom-info',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full flex flex-col">
      @if (props().element) {
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
              {{ props().element?.name }}
              @if (props().netCharge !== 0) {
                <span class="text-lg px-2 py-0.5 rounded-md font-mono"
                      [class.bg-rose-100]="props().netCharge > 0"
                      [class.text-rose-700]="props().netCharge > 0"
                      [class.bg-cyan-100]="props().netCharge < 0"
                      [class.text-cyan-700]="props().netCharge < 0">
                  {{ props().netCharge > 0 ? '+' : '' }}{{ props().netCharge }}
                </span>
              }
            </h2>
            <p class="text-slate-500 mt-1">{{ props().isotopeName }}</p>
          </div>
          <div class="w-16 h-16 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700 font-mono">
            {{ props().element?.symbol }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div class="text-sm text-slate-500 mb-1">Массовое число</div>
            <div class="text-2xl font-mono font-semibold text-slate-800">{{ props().massNumber }}</div>
          </div>
          <div class="p-4 rounded-xl border"
               [class.bg-emerald-50]="props().isStable"
               [class.border-emerald-200]="props().isStable"
               [class.bg-amber-50]="!props().isStable"
               [class.border-amber-200]="!props().isStable">
            <div class="text-sm mb-1"
                 [class.text-emerald-700]="props().isStable"
                 [class.text-amber-700]="!props().isStable">
              Стабильность ядра
            </div>
            <div class="text-lg font-semibold flex items-center gap-2"
                 [class.text-emerald-800]="props().isStable"
                 [class.text-amber-800]="!props().isStable">
              <mat-icon class="text-[20px] w-[20px] h-[20px]">
                {{ props().isStable ? 'check_circle' : 'warning' }}
              </mat-icon>
              {{ props().isStable ? 'Стабильно' : 'Радиоактивно' }}
            </div>
          </div>
        </div>

        <div class="flex-grow">
          <h4 class="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wider">Природа элемента</h4>
          <p class="text-slate-600 leading-relaxed">
            {{ props().element?.description }}
          </p>
          
          @if (props().netCharge !== 0) {
            <div class="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 class="text-sm font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                <mat-icon class="text-[18px] w-[18px] h-[18px]">electric_bolt</mat-icon>
                Ион ({{ props().ionType === 'cation' ? 'Катион' : 'Анион' }})
              </h4>
              <p class="text-sm text-indigo-800">
                Этот атом имеет электрический заряд. Он будет активно притягиваться к атомам с противоположным зарядом, образуя ионные связи (как в соли).
              </p>
            </div>
          }
        </div>
      } @else {
        <div class="flex-grow flex flex-col items-center justify-center text-center">
          <mat-icon class="text-6xl text-slate-300 mb-4">science</mat-icon>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Неизвестный элемент</h3>
          <p class="text-slate-500">
            Мы пока ограничили симуляцию первыми 8 элементами таблицы Менделеева для простоты понимания.
          </p>
        </div>
      }
    </div>
  `
})
export class AtomInfoComponent {
  props = input.required<AtomComputedProperties>();
}
