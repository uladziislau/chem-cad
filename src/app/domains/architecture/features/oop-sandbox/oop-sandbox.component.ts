import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CovalentBond, Molecule, Reactor, HydrogenCombustionMechanism } from '../../models';
import { ChemistryInventoryService } from '../../services/chemistry-inventory.service';
import { SmilesParserService } from '../../services/smiles-parser.service';
import { runReaction, runVirtualLab, runThermodynamics, runSimulation, OopSandboxContext } from './oop-sandbox.demos';
import { runGraphAnalysis, runQuantumDemo, runMolecularDynamics } from './oop-sandbox.analysis-demos';

@Component({
  selector: 'app-oop-sandbox',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './oop-sandbox.component.html',
})
export class OopSandboxComponent implements OnDestroy {
  // Live Runtime State
  isLiveRunning = signal(false);
  liveTemp = signal(298);
  liveMoleculeCount = signal(0);
  private liveReactor: Reactor | null = null;
  private liveInterval: ReturnType<typeof setInterval> | undefined;
  
  smilesInput = signal('CC(=O)OC1=CC=CC=C1C(=O)O');

  private inventory = inject(ChemistryInventoryService);
  private smilesParser = inject(SmilesParserService);

  ngOnDestroy() {
    if (this.liveInterval) {
      clearInterval(this.liveInterval);
    }
  }

  toggleLive() {
    if (this.isLiveRunning()) {
      this.isLiveRunning.set(false);
      clearInterval(this.liveInterval);
      this.addLog('<span class="text-rose-600">>> Live-цикл остановлен.</span>');
    } else {
      this.logs.set([]);
      this.isLiveRunning.set(true);
      
      // Инициализируем колбу
      this.liveReactor = new Reactor(this.liveTemp(), 1, 1);
      this.liveReactor.addMechanism(new HydrogenCombustionMechanism());
      this.liveMoleculeCount.set(this.liveReactor.contents.length);
      
      this.addLog('<span class="text-teal-600 font-bold">>> Запущен Live-цикл (Runtime).</span>');
      this.addLog('Колба работает в реальном времени. Изменяйте температуру ползунком и впрыскивайте газы!');

      // Запускаем игровой цикл (Game Loop) - 2 тика в секунду для наглядности логов
      this.liveInterval = setInterval(() => {
        if (this.liveReactor) {
          // Синхронизируем температуру из UI в движок
          this.liveReactor.temperature = this.liveTemp();
          
          const tickLogs = this.liveReactor.tick();
          
          // Выводим логи только если произошло что-то интересное (реакция)
          const hasReaction = tickLogs.some(l => l.includes('[Реакция!]'));
          if (hasReaction) {
            tickLogs.forEach(l => this.addLog(l));
          }

          // Обновляем UI
          this.liveMoleculeCount.set(this.liveReactor.contents.length);
        }
      }, 500);
    }
  }

  addLiveReactants() {
    if (!this.liveReactor) return;
    
    // Добавляем 2 молекулы H2 и 1 молекулу O2
    const h1 = this.inventory.createAtom('H');
    const h2 = this.inventory.createAtom('H');
    this.liveReactor.addMolecule(new Molecule([h1, h2], [new CovalentBond(h1, h2, 'single')]));
    
    const h3 = this.inventory.createAtom('H');
    const h4 = this.inventory.createAtom('H');
    this.liveReactor.addMolecule(new Molecule([h3, h4], [new CovalentBond(h3, h4, 'single')]));
    
    const o1 = this.inventory.createAtom('O');
    const o2 = this.inventory.createAtom('O');
    this.liveReactor.addMolecule(new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]));
    
    this.liveMoleculeCount.set(this.liveReactor.contents.length);
    this.addLog('<span class="text-blue-600">Впрыснута порция газа: 2x H₂, 1x O₂</span>');
  }

  onTempChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.liveTemp.set(parseInt(val, 10));
  }

  onSmilesChange(event: Event) {
    this.smilesInput.set((event.target as HTMLInputElement).value);
  }

  setSmiles(smiles: string) {
    this.smilesInput.set(smiles);
  }

  parseSmiles() {
    this.logs.set([]);
    this.molecule.set(null);
    const smiles = this.smilesInput();
    
    this.addLog(`<span class="text-fuchsia-600">>> Запуск Хемоинформатики: Парсинг SMILES</span>`);
    this.addLog(`Входная строка: <span class="font-bold font-mono bg-slate-200 px-1 rounded">${smiles}</span>`);
    
    try {
      const start = performance.now();
      const parsedMolecule = this.smilesParser.parse(smiles);
      const end = performance.now();
      
      this.molecule.set(parsedMolecule);
      
      this.addLog(`<span class="text-emerald-600 font-bold">Успешно!</span> ООП-Граф сгенерирован за ${(end - start).toFixed(2)} мс.`);
      this.addLog(`Создано узлов (Атомов): <b>${parsedMolecule.atoms.length}</b>`);
      this.addLog(`Создано ребер (Связей): <b>${parsedMolecule.bonds.length}</b>`);
      
      // Выводим формулу для проверки
      this.addLog(`Брутто-формула: <b>${parsedMolecule.getFormula()}</b>`);
      this.addLog(`Молекулярная масса: <b>${parsedMolecule.getMolecularMass().toFixed(2)} а.е.м.</b>`);
      
    } catch (e: unknown) {
      const error = e as Error;
      this.addLog(`<span class="text-rose-600 font-bold">Ошибка парсинга:</span> ${error.message}`);
    }
  }

  logs = signal<string[]>([]);
  molecule = signal<Molecule | null>(null);

  runReaction() { runReaction(this as unknown as OopSandboxContext); }
  runGraphAnalysis() { runGraphAnalysis(this as unknown as OopSandboxContext); }
  runQuantumDemo() { runQuantumDemo(this as unknown as OopSandboxContext); }
  runVirtualLab() { runVirtualLab(this as unknown as OopSandboxContext); }
  runThermodynamics() { runThermodynamics(this as unknown as OopSandboxContext); }
  runMolecularDynamics() { runMolecularDynamics(this as unknown as OopSandboxContext); }
  runSimulation(type: 'water' | 'co2') { runSimulation(this as unknown as OopSandboxContext, type); }


  private addLog(msg: string) {
    this.logs.update(prev => [...prev, msg]);
  }
}
