import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ThermoEngineService } from '../../services/thermo-engine.service';

@Component({
  selector: 'app-reaction-predictor',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="max-w-6xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">Прогнозирование реакций</h1>
          <p class="text-slate-600">Термодинамика: почему одни реакции идут сами, а другие — нет.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Левая панель: Уравнение и Температура -->
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
                <mat-icon class="text-indigo-600">functions</mat-icon>
                Уравнение реакции
              </h2>
              
              <div class="flex flex-wrap items-center justify-center gap-4 text-2xl font-mono p-6 bg-slate-50 rounded-xl border border-slate-200">
                @for (r of reactants; track r.symbol) {
                  <div class="flex items-center gap-1">
                    @if (r.coefficient > 1) { <span class="text-indigo-600 font-bold">{{ r.coefficient }}</span> }
                    <span>{{ r.symbol }}</span>
                  </div>
                  @if (!$last) { <span class="text-slate-400">+</span> }
                }
                
                <mat-icon class="text-slate-400 mx-4">arrow_forward</mat-icon>
                
                @for (p of products; track p.symbol) {
                  <div class="flex items-center gap-1">
                    @if (p.coefficient > 1) { <span class="text-indigo-600 font-bold">{{ p.coefficient }}</span> }
                    <span>{{ p.symbol }}</span>
                  </div>
                  @if (!$last) { <span class="text-slate-400">+</span> }
                }
              </div>

              <div class="mt-8">
                <label for="temp-slider" class="block text-sm font-medium text-slate-700 mb-4">
                  Температура среды: {{ tempCelsius() }}°C ({{ thermo.temperature() | number:'1.0-0' }} K)
                </label>
                <input 
                  id="temp-slider"
                  type="range" 
                  min="-100" 
                  max="1000" 
                  [value]="tempCelsius()" 
                  (input)="onTempChange($event)"
                  class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                >
                <div class="flex justify-between text-xs text-slate-400 mt-2">
                  <span>-100°C</span>
                  <span>0°C</span>
                  <span>100°C</span>
                  <span>500°C</span>
                  <span>1000°C</span>
                </div>
              </div>
            </div>

            <!-- Визуализация энергии (Упрощенно) -->
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
                <mat-icon class="text-amber-600">bolt</mat-icon>
                Энергетический профиль
              </h2>
              
              <div class="h-48 flex items-end gap-12 justify-center relative border-b border-slate-200 pb-2">
                <!-- Реагенты -->
                <div class="w-32 bg-indigo-100 border-2 border-indigo-300 rounded-t-lg flex flex-col items-center justify-center p-2"
                     [style.height.%]="50">
                  <span class="text-xs font-bold text-indigo-700">РЕАГЕНТЫ</span>
                  <span class="text-[10px] text-indigo-500">H_start</span>
                </div>

                <!-- Стрелка перехода -->
                <div class="flex flex-col items-center justify-center h-full">
                  <mat-icon class="text-slate-300 text-4xl" [class.text-rose-400]="calc().deltaH < 0" [class.text-blue-400]="calc().deltaH > 0">
                    {{ calc().deltaH < 0 ? 'trending_down' : 'trending_up' }}
                  </mat-icon>
                  <span class="text-xs font-mono font-bold" [class.text-rose-600]="calc().deltaH < 0" [class.text-blue-600]="calc().deltaH > 0">
                    ΔH = {{ calc().deltaH | number:'1.0-1' }} кДж
                  </span>
                </div>

                <!-- Продукты -->
                <div class="w-32 bg-emerald-100 border-2 border-emerald-300 rounded-t-lg flex flex-col items-center justify-center p-2 transition-all duration-500"
                     [style.height.%]="50 + (calc().deltaH / 10)">
                  <span class="text-xs font-bold text-emerald-700">ПРОДУКТЫ</span>
                  <span class="text-[10px] text-emerald-500">H_end</span>
                </div>

                <!-- Подпись типа реакции -->
                <div class="absolute -top-4 right-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                     [class.bg-rose-100]="calc().deltaH < 0" [class.text-rose-700]="calc().deltaH < 0"
                     [class.bg-blue-100]="calc().deltaH > 0" [class.text-blue-700]="calc().deltaH > 0">
                  {{ calc().deltaH < 0 ? 'Экзотермическая' : 'Эндотермическая' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Правая панель: Результаты и Энергия Гиббса -->
          <div class="space-y-6">
            <div class="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl border border-indigo-800">
              <h2 class="text-lg font-semibold mb-6 opacity-80">Энергия Гиббса (ΔG)</h2>
              
              <div class="text-center mb-8">
                <div class="text-5xl font-mono font-bold mb-2 tracking-tighter">
                  {{ calc().deltaG | number:'1.0-1' }}
                </div>
                <div class="text-indigo-300 text-sm">кДж/моль</div>
              </div>

              <div class="p-4 rounded-xl border border-white/10"
                   [class.bg-emerald-500/20]="calc().isSpontaneous"
                   [class.bg-rose-500/20]="!calc().isSpontaneous">
                <div class="flex items-center gap-3 mb-2">
                  <mat-icon [class.text-emerald-400]="calc().isSpontaneous" [class.text-rose-400]="!calc().isSpontaneous">
                    {{ calc().isSpontaneous ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                  <span class="font-bold">
                    {{ calc().isSpontaneous ? 'РЕАКЦИЯ ИДЕТ' : 'РЕАКЦИЯ НЕ ИДЕТ' }}
                  </span>
                </div>
                <p class="text-xs text-indigo-200 leading-relaxed">
                  {{ calc().isSpontaneous 
                    ? 'Энергия системы уменьшается. Реакция термодинамически выгодна при данной температуре.' 
                    : 'Системе не хватает энергии для превращения. Реакция невозможна без внешнего воздействия.' }}
                </p>
              </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 class="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Разбор формулы</h3>
              <div class="space-y-4 font-mono text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-slate-500">ΔH (Тепло)</span>
                  <span class="font-bold">{{ calc().deltaH | number:'1.0-1' }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500">T * ΔS (Хаос)</span>
                  <span class="font-bold text-amber-600">{{ (thermo.temperature() * calc().deltaS) | number:'1.0-1' }}</span>
                </div>
                <div class="border-t border-slate-100 pt-2 flex justify-between items-center text-lg">
                  <span class="font-bold">ΔG</span>
                  <span class="font-bold text-indigo-600">{{ calc().deltaG | number:'1.0-1' }}</span>
                </div>
              </div>
            </div>

            <div class="p-6 bg-amber-50 rounded-2xl border border-amber-100">
              <div class="flex gap-3">
                <mat-icon class="text-amber-600">lightbulb</mat-icon>
                <div>
                  <h4 class="text-sm font-bold text-amber-900 mb-1">Совет Профессора</h4>
                  <p class="text-xs text-amber-800 leading-relaxed">
                    Попробуйте изменить температуру. Некоторые реакции (как горение водорода) идут всегда, а некоторые — только при сильном нагреве!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ReactionPredictorComponent {
  thermo = inject(ThermoEngineService);
  tempCelsius = signal<number>(25);

  reactants = this.thermo.getReactants();
  products = this.thermo.getProducts();
  calc = this.thermo.calculation;

  onTempChange(event: Event) {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    this.tempCelsius.set(val);
    this.thermo.setTemperature(val);
  }
}
