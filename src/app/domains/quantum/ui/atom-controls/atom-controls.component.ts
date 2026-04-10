import { Component, output, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AtomState } from '../../models/atom.model';

@Component({
  selector: 'app-atom-controls',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <mat-icon class="text-indigo-600">tune</mat-icon>
        Конструктор атома
      </h3>
      
      <div class="space-y-6">
        <!-- Protons -->
        <div class="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
          <div>
            <div class="font-semibold text-rose-900">Протоны (p⁺)</div>
            <div class="text-sm text-rose-700">Определяют элемент</div>
          </div>
          <div class="flex items-center gap-4">
            <button (click)="remove.emit('proton')" [disabled]="state().protons <= 1"
                    class="w-10 h-10 rounded-full bg-white border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="text-xl font-mono font-bold text-rose-900 w-6 text-center">{{ state().protons }}</span>
            <button (click)="add.emit('proton')" [disabled]="state().protons >= 8"
                    class="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>

        <!-- Neutrons -->
        <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <div class="font-semibold text-slate-900">Нейтроны (n⁰)</div>
            <div class="text-sm text-slate-600">Определяют изотоп и массу</div>
          </div>
          <div class="flex items-center gap-4">
            <button (click)="remove.emit('neutron')" [disabled]="state().neutrons <= 0"
                    class="w-10 h-10 rounded-full bg-white border border-slate-300 text-slate-600 flex items-center justify-center hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="text-xl font-mono font-bold text-slate-900 w-6 text-center">{{ state().neutrons }}</span>
            <button (click)="add.emit('neutron')" [disabled]="state().neutrons >= 10"
                    class="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>

        <!-- Electrons -->
        <div class="flex items-center justify-between p-4 bg-cyan-50 rounded-xl border border-cyan-100">
          <div>
            <div class="font-semibold text-cyan-900">Электроны (e⁻)</div>
            <div class="text-sm text-cyan-700">Определяют заряд и химию</div>
          </div>
          <div class="flex items-center gap-4">
            <button (click)="remove.emit('electron')" [disabled]="state().electrons <= 0"
                    class="w-10 h-10 rounded-full bg-white border border-cyan-200 text-cyan-600 flex items-center justify-center hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <mat-icon>remove</mat-icon>
            </button>
            <span class="text-xl font-mono font-bold text-cyan-900 w-6 text-center">{{ state().electrons }}</span>
            <button (click)="add.emit('electron')" [disabled]="state().electrons >= 10"
                    class="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AtomControlsComponent {
  state = input.required<AtomState>();
  add = output<'proton' | 'neutron' | 'electron'>();
  remove = output<'proton' | 'neutron' | 'electron'>();
}
