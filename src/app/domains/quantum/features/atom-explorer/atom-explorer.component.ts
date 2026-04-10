import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { QuantumEngineService } from '../../services/quantum-engine.service';
import { Atom3DViewerComponent } from '../../ui/atom-3d-viewer/atom-3d-viewer.component';
import { AtomControlsComponent } from '../../ui/atom-controls/atom-controls.component';
import { AtomInfoComponent } from '../../ui/atom-info/atom-info.component';

@Component({
  selector: 'app-atom-explorer',
  standalone: true,
  imports: [MatIconModule, Atom3DViewerComponent, AtomControlsComponent, AtomInfoComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <mat-icon>blur_on</mat-icon>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Квантовый уровень</h1>
        </div>
        <p class="text-lg text-slate-600 max-w-3xl">
          Познайте химию через фундаментальные частицы. Добавляйте протоны, чтобы менять суть вещества. 
          Меняйте нейтроны, чтобы управлять массой. Управляйте электронами, чтобы понять природу химических связей.
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: 3D Viewer & Controls -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <app-atom-3d-viewer [atomState]="engine.atomState()"></app-atom-3d-viewer>
          <app-atom-controls 
            [state]="engine.atomState()"
            (add)="engine.addParticle($event)"
            (remove)="engine.removeParticle($event)">
          </app-atom-controls>
        </div>

        <!-- Right Column: Info & Philosophy -->
        <div class="flex flex-col gap-6">
          <app-atom-info [props]="engine.properties()"></app-atom-info>
          
          <div class="bg-slate-900 rounded-2xl p-6 text-slate-300 border border-slate-800 shadow-lg">
            <h4 class="text-white font-semibold mb-3 flex items-center gap-2">
              <mat-icon class="text-indigo-400">lightbulb</mat-icon>
              Смысл химии
            </h4>
            <p class="text-sm leading-relaxed mb-4">
              Химия — это наука об <strong>электронных оболочках</strong>. Ядро (протоны и нейтроны) спрятано глубоко внутри и почти никогда не участвует в обычных реакциях.
            </p>
            <p class="text-sm leading-relaxed">
              Когда вы меняете количество электронов, вы создаете ион. Именно стремление атомов отдать, забрать или поделить электроны (чтобы заполнить свои орбиты) заставляет их соединяться в молекулы, создавая всё многообразие нашего мира.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AtomExplorerComponent {
  engine = inject(QuantumEngineService);
}
