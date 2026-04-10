import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Pro3DViewerComponent } from '../../../simulator/features/pro-3d-viewer/pro-3d-viewer.component';
import { JsmeEditorComponent } from '../../../simulator/features/jsme-editor/jsme-editor.component';
import { ChemEventBusService, SystemEventType, SystemEvent } from '../../../architecture/services/chem-event-bus.service';
import { SmilesParserService } from '../../../architecture/services/smiles-parser.service';
import { ChemCoreService, ChemCoreProperties } from '../../../architecture/services/chem-core.service';
import { Molecule } from '../../../architecture/models';

@Component({
  selector: 'app-molecule-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, Pro3DViewerComponent, JsmeEditorComponent],
  template: `
    <div class="h-[calc(100vh-8rem)] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans rounded-3xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      <!-- 2D Редактор (Модальное окно) -->
      @if (show2DEditor()) {
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <app-jsme-editor 
            (editorClose)="show2DEditor.set(false)"
            (smilesGenerated)="onSmilesFromEditor($event)">
          </app-jsme-editor>
        </div>
      }

      <main class="flex-1 flex overflow-hidden relative">
        
        <!-- Левая панель: Управление и Ввод -->
        <aside class="w-80 border-r border-white/10 bg-slate-900/30 backdrop-blur-sm flex flex-col z-10">
          <div class="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
            
            <!-- Ввод SMILES -->
            <section>
              <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <mat-icon class="text-sm">terminal</mat-icon>
                SMILES Анализатор
              </h3>
              <div class="space-y-3">
                <div class="relative">
                  <input 
                    type="text" 
                    [ngModel]="smilesInput()"
                    (ngModelChange)="onSmilesChange($event)"
                    placeholder="Введите SMILES код..."
                    class="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-white">
                </div>
                <button 
                  (click)="parseSmiles()"
                  class="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <mat-icon class="text-sm">auto_awesome</mat-icon>
                  Создать 3D Модель
                </button>
                <button 
                  (click)="show2DEditor.set(true)"
                  class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-xl py-2 text-xs font-semibold transition-all flex items-center justify-center gap-2">
                  <mat-icon class="text-sm">draw</mat-icon>
                  Нарисовать 2D Структуру
                </button>
              </div>
              
              <div class="mt-4 flex flex-wrap gap-2">
                <button (click)="setSmiles('O')" class="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">Вода</button>
                <button (click)="setSmiles('CCO')" class="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">Этанол</button>
                <button (click)="setSmiles('OCC(O)CO')" class="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">Глицерин</button>
                <button (click)="setSmiles('CC(=O)OC1=CC=CC=C1C(=O)O')" class="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">Аспирин</button>
              </div>
            </section>

            <!-- Свойства молекулы -->
            @if (currentMolecule(); as mol) {
              <section class="animate-in fade-in slide-in-from-left duration-500">
                <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <mat-icon class="text-sm">info</mat-icon>
                  Характеристики
                </h3>
                <div class="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-xs text-slate-500">Формула</span>
                    <span class="text-sm font-bold text-indigo-300">{{ mol.getFormula() }}</span>
                  </div>
                  
                  @if (chemCoreProps(); as props) {
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500" title="Точная масса (ChemCore)">Точная масса</span>
                      <span class="text-sm font-bold text-indigo-300">{{ props.exactMass.toFixed(3) }} а.е.м.</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500" title="Коэффициент распределения (Липофильность - ChemCore)">LogP</span>
                      <span class="text-sm font-bold" [class.text-rose-400]="props.logP > 5" [class.text-emerald-400]="props.logP <= 5">{{ props.logP.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500" title="Топологическая полярная площадь поверхности (ChemCore)">TPSA</span>
                      <span class="text-sm font-bold text-indigo-300">{{ props.tpsa.toFixed(1) }} Å²</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500" title="Доноры / Акцепторы водородной связи (ChemCore)">H-Связи (Д/А)</span>
                      <span class="text-sm font-bold text-indigo-300">{{ props.hDonors }} / {{ props.hAcceptors }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500">Циклы</span>
                      <span class="text-sm font-bold text-indigo-300">{{ props.numRings }}</span>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                      <span class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Движок GPU</span>
                      <div class="flex items-center gap-1.5">
                        <div class="w-1.5 h-1.5 rounded-full" 
                             [class.bg-emerald-500]="props.gpuStatus === 'active'"
                             [class.bg-slate-600]="props.gpuStatus === 'inactive'"
                             [class.bg-rose-500]="props.gpuStatus === 'error'"></div>
                        <span class="text-[10px] font-mono"
                              [class.text-emerald-400]="props.gpuStatus === 'active'"
                              [class.text-slate-500]="props.gpuStatus === 'inactive'"
                              [class.text-rose-400]="props.gpuStatus === 'error'">
                          {{ props.gpuStatus === 'active' ? 'WEB-GPU ACTIVE' : props.gpuStatus === 'error' ? 'GPU ERROR' : 'CPU FALLBACK' }}
                        </span>
                      </div>
                    </div>
                  } @else {
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500">Масса (Базовая)</span>
                      <span class="text-sm font-bold text-indigo-300">{{ mol.getMolecularMass().toFixed(2) }} а.е.м.</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-slate-500">Атомы</span>
                      <span class="text-sm font-bold text-indigo-300">{{ mol.atoms.length }}</span>
                    </div>
                    <div class="text-center text-[10px] text-slate-500 italic mt-2">
                      Инициализация ChemCore GPU...
                    </div>
                  }
                </div>
              </section>
            }
          </div>
        </aside>

        <!-- Основной вьюпорт -->
        <div class="flex-1 relative bg-black rounded-r-3xl overflow-hidden">
          <app-pro-3d-viewer [smiles]="smilesInput()" class="w-full h-full block"></app-pro-3d-viewer>
          
          <!-- Оверлей логов -->
          <div class="absolute bottom-6 right-6 w-96 max-h-48 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-none sm:pointer-events-auto">
            <div class="px-4 py-2 border-b border-white/10 flex justify-between items-center bg-white/5">
              <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Системный Журнал</span>
              <div class="flex gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              </div>
            </div>
            <div class="p-4 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-400 custom-scrollbar">
              @for (log of logs(); track $index) {
                <div [innerHTML]="log" class="border-l border-indigo-500/30 pl-2 py-0.5"></div>
              }
              @if (logs().length === 0) {
                <div class="text-slate-600 italic">Ожидание системных событий...</div>
              }
            </div>
          </div>
        </div>
      </main>
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
export class MoleculeExplorerComponent {
  smilesInput = signal('CC(=O)OC1=CC=CC=C1C(=O)O');
  currentMolecule = signal<Molecule | null>(null);
  chemCoreProps = signal<ChemCoreProperties | null>(null);
  logs = signal<string[]>([]);
  history = signal<string[]>([]);
  
  show2DEditor = signal(false);
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private smilesParser = inject(SmilesParserService);
  private eventBus = inject(ChemEventBusService);
  private chemCore = inject(ChemCoreService);

  constructor() {
    // Listen to system events to update the dashboard UI
    this.eventBus.on<unknown>(SystemEventType.MOLECULE_PARSED).subscribe(async (event: SystemEvent<unknown>) => {
      const payload = event.payload as { molecule: Molecule, smiles: string, atomsCount: number };
      this.currentMolecule.set(payload.molecule);
      this.addLog(`<span class="text-indigo-400">TopologyNode:</span> Молекула успешно обработана (${payload.atomsCount} атомов)`);
      
      // Calculate hi-end properties using ChemCore
      const props = await this.chemCore.calculateProperties(payload.molecule);
      if (props) {
        this.chemCoreProps.set(props);
        const gpuLog = props.gpuStatus === 'active' ? ' [GPU Accelerated]' : '';
        this.addLog(`<span class="text-emerald-400">ChemCoreNode:</span> Расчет характеристик завершен${gpuLog} (LogP: ${props.logP.toFixed(2)})`);
      } else {
        this.chemCoreProps.set(null);
      }
      
      // Add to history if not already there
      if (!this.history().includes(payload.smiles)) {
        this.history.update(h => [payload.smiles, ...h].slice(0, 5));
      }
    });

    this.eventBus.on<unknown>(SystemEventType.SYSTEM_ERROR).subscribe((event: SystemEvent<unknown>) => {
      this.addLog(`<span class="text-rose-500">Ошибка:</span> ${event.payload as string}`);
    });
  }

  onSmilesFromEditor(smiles: string) {
    this.smilesInput.set(smiles);
    this.show2DEditor.set(false);
    this.parseSmiles();
  }

  onSmilesChange(smiles: string) {
    this.smilesInput.set(smiles);
  }

  setSmiles(smiles: string) {
    this.smilesInput.set(smiles);
    this.parseSmiles();
  }

  parseSmiles() {
    const smiles = this.smilesInput();
    if (!smiles) return;

    this.addLog(`<span class="text-slate-500">Пользователь:</span> Анализ SMILES: <span class="text-white">${smiles}</span>`);
    
    try {
      this.smilesParser.parse(smiles);
    } catch (e: unknown) {
      const error = e as Error;
      this.addLog(`<span class="text-rose-500">ОшибкаПарсера:</span> ${error.message}`);
    }
  }

  private addLog(msg: string) {
    this.logs.update(l => [...l, msg].slice(-20));
  }
}
