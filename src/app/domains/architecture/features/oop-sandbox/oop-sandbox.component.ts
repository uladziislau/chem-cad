import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CovalentBond, Molecule, SynthesisReaction, MoleculeGraph, AtomNode, BondEdge, Orbital, Electron, Spin, Sp3Hybridization, Reactor, HydrogenCombustionMechanism, ThermodynamicsEngine, MolecularDynamicsEngine } from '../../models';
import { ChemistryInventoryService } from '../../services/chemistry-inventory.service';
import { SmilesParserService } from '../../services/smiles-parser.service';

@Component({
  selector: 'app-oop-sandbox',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <mat-icon class="text-indigo-600 scale-150 mr-2">data_object</mat-icon>
          ООП-Химия: Эксперимент
        </h1>
        <p class="text-slate-600 mt-2 text-lg">
          Программируем молекулу воды (H₂O) используя строгие интерфейсы и классы.
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Левая колонка: Код -->
        <div class="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 overflow-hidden flex flex-col">
          <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
            <h2 class="text-xl font-mono text-indigo-400 flex items-center gap-2">
              <mat-icon>code</mat-icon> interfaces.ts
            </h2>
          </div>
          <pre class="text-sm font-mono text-slate-300 overflow-x-auto flex-1"><code><span class="text-pink-400">interface</span> <span class="text-emerald-300">IBondable</span> {{ '{' }}
  currentBonds: <span class="text-indigo-300">number</span>;
  maxValence: <span class="text-indigo-300">number</span>;
  canBond(other: <span class="text-emerald-300">IBondable</span>): <span class="text-indigo-300">boolean</span>;
{{ '}' }}

<span class="text-pink-400">interface</span> <span class="text-emerald-300">IAtom</span> {{ '{' }}
  shells: <span class="text-emerald-300">IElectronShell</span>[];
  valenceElectrons: <span class="text-indigo-300">number</span>;
{{ '}' }}

<span class="text-pink-400">interface</span> <span class="text-emerald-300">IReaction</span> {{ '{' }}
  isPossible(env: <span class="text-emerald-300">IEnvironment</span>): <span class="text-indigo-300">boolean</span>;
  execute(): {{ '{' }} energyReleased: <span class="text-indigo-300">number</span> {{ '}' }};
{{ '}' }}

<span class="text-slate-500">// Программируем реакцию:</span>
<span class="text-pink-400">const</span> reaction = <span class="text-pink-400">new</span> <span class="text-emerald-300">SynthesisReaction</span>(reactants, products);
<span class="text-pink-400">if</span> (reaction.isPossible(env)) {{ '{' }}
  <span class="text-pink-400">const</span> res = reaction.execute();
{{ '}' }}

<span class="text-slate-500">// Проверяем интерфейс IBondable перед связью</span>
<span class="text-pink-400">if</span> (oxygen.canBond(hydrogen1)) {{ '{' }}
  <span class="text-pink-400">new</span> <span class="text-emerald-300">CovalentBond</span>(oxygen, hydrogen1, <span class="text-yellow-300">'single'</span>);
{{ '}' }}</code></pre>
        </div>

        <!-- Правая колонка: Результат выполнения -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
              <mat-icon class="text-emerald-600">play_circle</mat-icon> Runtime (Выполнение)
            </h2>
            <button 
              (click)="runSimulation('water')"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">water_drop</mat-icon>
              Собрать H₂O
            </button>
            <button 
              (click)="runSimulation('co2')"
              class="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">co2</mat-icon>
              Собрать CO₂
            </button>
            <button 
              (click)="runReaction()"
              class="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">bolt</mat-icon>
              Запустить Реакцию
            </button>
            <button 
              (click)="runGraphAnalysis()"
              class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">hub</mat-icon>
              Анализ Графов
            </button>
            <button 
              (click)="runQuantumDemo()"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">blur_on</mat-icon>
              Квантовый Уровень
            </button>
            <button 
              (click)="runVirtualLab()"
              class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">science</mat-icon>
              Виртуальная Колба
            </button>
            <button 
              (click)="runThermodynamics()"
              class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">local_fire_department</mat-icon>
              Термодинамика
            </button>
            <button 
              (click)="runMolecularDynamics()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2">
              <mat-icon class="text-sm">waves</mat-icon>
              Молекулярная Динамика
            </button>
          </div>

          <!-- Cheminformatics SMILES Parser -->
          <div class="mt-6 p-4 border-2 border-fuchsia-200 bg-fuchsia-50/50 rounded-xl">
            <h3 class="font-bold text-fuchsia-900 flex items-center gap-2 mb-4">
              <mat-icon class="text-fuchsia-600">code</mat-icon>
              Хемоинформатика: Парсер SMILES
            </h3>
            <div class="flex gap-3 mb-3">
              <input 
                type="text" 
                [value]="smilesInput()"
                (input)="onSmilesChange($event)"
                placeholder="Введите SMILES (например, CCO или CC(=O)O)"
                class="flex-1 px-4 py-2 border border-fuchsia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono text-sm">
              <button 
                (click)="parseSmiles()"
                class="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors font-medium text-sm flex items-center gap-2">
                <mat-icon class="text-sm">auto_awesome</mat-icon>
                Сгенерировать ООП-Граф
              </button>
            </div>
            <div class="flex gap-2 text-xs">
              <span class="text-slate-500">Примеры:</span>
              <button (click)="setSmiles('CCO')" class="text-fuchsia-600 hover:underline font-mono">Этанол (CCO)</button>
              <button (click)="setSmiles('CC(=O)O')" class="text-fuchsia-600 hover:underline font-mono">Уксусная кислота (CC(=O)O)</button>
              <button (click)="setSmiles('CC(=O)OC1=CC=CC=C1C(=O)O')" class="text-fuchsia-600 hover:underline font-mono">Аспирин</button>
            </div>
          </div>

          <!-- Live Runtime Demo -->
          <div class="mt-6 p-4 border-2 border-teal-200 bg-teal-50/50 rounded-xl">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-teal-900 flex items-center gap-2">
                @if (isLiveRunning()) {
                  <mat-icon class="text-teal-600 animate-pulse">science</mat-icon>
                } @else {
                  <mat-icon class="text-teal-600">science</mat-icon>
                }
                Live Runtime Эмерджентность
              </h3>
              <div class="flex gap-2">
                <button 
                  (click)="toggleLive()"
                  [class]="isLiveRunning() ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'"
                  class="px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2">
                  <mat-icon class="text-sm">{{ isLiveRunning() ? 'stop' : 'play_arrow' }}</mat-icon>
                  {{ isLiveRunning() ? 'Остановить' : 'Запустить цикл' }}
                </button>
                <button 
                  (click)="addLiveReactants()"
                  [disabled]="!isLiveRunning()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center gap-2">
                  <mat-icon class="text-sm">add</mat-icon>
                  Впрыснуть H₂ + O₂
                </button>
              </div>
            </div>

            <div class="flex gap-6 items-center bg-white p-4 rounded-lg shadow-sm">
              <div class="flex-1 flex flex-col gap-2">
                <label for="tempRange" class="text-sm font-bold text-slate-700 flex justify-between">
                  <span>Температура в колбе:</span>
                  <span [class]="liveTemp() > 400 ? 'text-rose-600' : 'text-blue-600'">{{ liveTemp() }}K</span>
                </label>
                <input 
                  id="tempRange"
                  type="range" 
                  min="0" max="1000" 
                  [value]="liveTemp()" 
                  (input)="onTempChange($event)"
                  class="w-full accent-teal-600">
                <span class="text-xs text-slate-500">Порог воспламенения водорода: ~400K</span>
              </div>
              
              <div class="w-px h-12 bg-slate-200"></div>
              
              <div class="flex-1">
                <div class="text-sm font-bold text-slate-700 mb-1">Содержимое колбы:</div>
                <div class="font-mono text-lg text-teal-800">
                  Всего молекул: {{ liveMoleculeCount() }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100 font-mono text-sm overflow-y-auto">
            @for (log of logs(); track $index) {
              <div class="mb-2 pb-2 border-b border-slate-200 last:border-0" [innerHTML]="log"></div>
            }
            @if (logs().length === 0) {
              <div class="text-slate-400 flex items-center justify-center h-full italic">
                Нажмите кнопку, чтобы запустить ООП-симуляцию...
              </div>
            }
          </div>

          @if (molecule()) {
            <div class="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 class="text-emerald-800 font-bold mb-2">Объект IMolecule успешно создан!</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-slate-500 block">Формула (getFormula):</span>
                  <span class="font-bold text-lg">{{ molecule()?.getFormula() }}</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Масса (getMolecularMass):</span>
                  <span class="font-bold text-lg">{{ molecule()?.getMolecularMass() | number:'1.0-2' }} а.е.м.</span>
                </div>
                <div>
                  <span class="text-slate-500 block">Полярность молекулы:</span>
                  <span class="font-bold" [class.text-rose-600]="molecule()?.isPolarMolecule()" [class.text-emerald-600]="!molecule()?.isPolarMolecule()">
                    {{ molecule()?.isPolarMolecule() ? 'Да (Диполь)' : 'Нет (Симметрична)' }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
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

  runReaction() {
    this.logs.set([]);
    this.molecule.set(null);
    this.addLog('<span class="text-blue-600">>> Запуск IReaction: 2H₂ + O₂ → 2H₂O</span>');

    // Используем инвентарь
    const h1 = this.inventory.createAtom('H');
    const h2 = this.inventory.createAtom('H');
    const h2_mol = new Molecule([h1, h2], [new CovalentBond(h1, h2, 'single')]);

    const o1 = this.inventory.createAtom('O');
    const o2 = this.inventory.createAtom('O');
    const o2_mol = new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]);

    this.addLog(`Реагенты готовы: 2 объекта H₂ и 1 объект O₂ (из Inventory)`);

    // Создаем продукт
    const water_o = this.inventory.createAtom('O');
    const water_h1 = this.inventory.createAtom('H');
    const water_h2 = this.inventory.createAtom('H');
    const water_mol = new Molecule([water_o, water_h1, water_h2], [
      new CovalentBond(water_o, water_h1, 'single'),
      new CovalentBond(water_o, water_h2, 'single')
    ]);

    this.addLog('<br><span class="text-blue-600">>> Проверка условий IEnvironment...</span>');
    const env = { temperature: 500, pressure: 1 };
    this.addLog(`Температура среды: ${env.temperature}K`);

    const reaction = new SynthesisReaction([h2_mol, h2_mol, o2_mol], [water_mol, water_mol]);
    
    if (reaction.isPossible(env)) {
      this.addLog(`<span class="text-emerald-600">✓ reaction.isPossible(env) == true</span>`);
      const result = reaction.execute();
      this.addLog(`<b>Реакция выполнена!</b>`);
      this.addLog(`Выделено энергии (ΔE): ${result.energyReleased} кДж/моль`);
      this.molecule.set(water_mol);
    }
  }

  runGraphAnalysis() {
    this.logs.set([]);
    this.molecule.set(null);
    this.addLog('<span class="text-amber-600">>> Запуск Топологического Анализа (Теория Графов)</span>');
    
    const graph = new MoleculeGraph();
    
    // Создаем циклогексан (C6H12) - упрощенно только углеродный скелет для демо
    this.addLog('Создаем углеродный скелет Циклогексана (кольцо из 6 атомов C)...');
    
    const carbons: AtomNode[] = [];
    for (let i = 0; i < 6; i++) {
      const c = this.inventory.createAtom('C');
      const node = new AtomNode(`C${i}`, c);
      graph.addNode(node);
      carbons.push(node);
    }
    
    // Соединяем в кольцо
    for (let i = 0; i < 6; i++) {
      const nextIdx = (i + 1) % 6; // Замыкаем 5-й на 0-й
      const bond = new CovalentBond(carbons[i].data, carbons[nextIdx].data, 'single');
      const edge = new BondEdge(`B${i}-${nextIdx}`, carbons[i].id, carbons[nextIdx].id, bond);
      graph.addEdge(edge);
      this.addLog(`Добавлено ребро (Связь): ${carbons[i].id} — ${carbons[nextIdx].id}`);
    }
    
    this.addLog('<br><span class="text-amber-600">>> Запуск алгоритма DFS (Поиск в глубину)...</span>');
    const hasCycles = graph.hasCycles();
    
    if (hasCycles) {
      this.addLog(`<span class="text-emerald-600 font-bold">✓ Алгоритм обнаружил цикл!</span>`);
      this.addLog(`Вывод: Молекула является циклической (алициклической или ароматической).`);
    } else {
      this.addLog(`Циклов не найдено. Молекула алифатическая (линейная).`);
    }
    
    this.addLog(`<br>Статистика графа:`);
    this.addLog(`Узлов (Атомов): ${graph.getNodes().length}`);
    this.addLog(`Ребер (Связей): ${graph.getEdges().length}`);
    this.addLog(`Степень вершины C0: ${graph.getDegree('C0')} (связей в скелете)`);
  }

  runQuantumDemo() {
    this.logs.set([]);
    this.molecule.set(null);
    this.addLog('<span class="text-purple-600">>> Запуск Квантово-механической модели (Углерод)</span>');
    
    this.addLog('Создаем валентные орбитали атома Углерода в основном состоянии (Ground State)...');
    
    // 2s орбиталь (энергия ниже)
    const sOrbital = new Orbital('2s', 10);
    sOrbital.addElectron(new Electron(Spin.UP));
    sOrbital.addElectron(new Electron(Spin.DOWN)); // 2s полностью заполнена
    
    // 2p орбитали (энергия выше)
    const px = new Orbital('2px', 15);
    const py = new Orbital('2py', 15);
    const pz = new Orbital('2pz', 15);
    
    // По правилу Хунда электроны занимают пустые орбитали
    px.addElectron(new Electron(Spin.UP));
    py.addElectron(new Electron(Spin.UP));
    // pz остается пустой
    
    const pOrbitals = [px, py, pz];
    
    this.addLog(`<br><b>Основное состояние (Ground State):</b>`);
    this.addLog(`[${sOrbital.name}] Электронов: ${sOrbital.electrons.length} (Неспаренных: ${sOrbital.hasUnpaired() ? 1 : 0})`);
    this.addLog(`[${px.name}] Электронов: ${px.electrons.length} (Неспаренных: ${px.hasUnpaired() ? 1 : 0})`);
    this.addLog(`[${py.name}] Электронов: ${py.electrons.length} (Неспаренных: ${py.hasUnpaired() ? 1 : 0})`);
    this.addLog(`[${pz.name}] Электронов: ${pz.electrons.length} (Неспаренных: ${pz.hasUnpaired() ? 1 : 0})`);
    
    const initialUnpaired = [sOrbital, ...pOrbitals].filter(o => o.hasUnpaired()).length;
    this.addLog(`<span class="text-rose-600">Валентность (кол-во неспаренных электронов): ${initialUnpaired}</span>`);
    this.addLog(`<i>Вывод: В основном состоянии углерод может образовать только 2 связи. Но в органике он всегда 4-хвалентен! Как?</i>`);
    
    this.addLog('<br><span class="text-purple-600">>> Применяем Паттерн Стратегия: Sp3Hybridization...</span>');
    
    const strategy = new Sp3Hybridization();
    const hybridOrbitals = strategy.hybridize(sOrbital, pOrbitals);
    
    this.addLog(`<br><b>Гибридизированное состояние (Excited State):</b>`);
    let finalUnpaired = 0;
    hybridOrbitals.forEach((orb, i) => {
      this.addLog(`[${orb.name} #${i+1}] Электронов: ${orb.electrons.length} (Неспаренных: ${orb.hasUnpaired() ? 1 : 0})`);
      if (orb.hasUnpaired()) finalUnpaired++;
    });
    
    this.addLog(`<span class="text-emerald-600 font-bold">Новая валентность: ${finalUnpaired}</span>`);
    this.addLog(`<i>Вывод: 1 s-орбиталь и 3 p-орбитали "смешались", образовав 4 одинаковые sp³ орбитали. Теперь углерод готов образовать 4 связи (например, Метан CH₄)!</i>`);
  }

  runVirtualLab() {
    this.logs.set([]);
    this.molecule.set(null);
    this.addLog('<span class="text-teal-600">>> Запуск Виртуальной Колбы (Эмерджентность)</span>');
    
    // Создаем колбу
    const reactor = new Reactor(298, 1, 1); // 298K (комнатная температура)
    reactor.addMechanism(new HydrogenCombustionMechanism());
    
    this.addLog(`Создана колба. Температура: ${reactor.temperature}K. Добавлен механизм: Горение водорода.`);
    
    // Наполняем колбу газами
    const h1 = this.inventory.createAtom('H');
    const h2 = this.inventory.createAtom('H');
    reactor.addMolecule(new Molecule([h1, h2], [new CovalentBond(h1, h2, 'single')]));
    
    const o1 = this.inventory.createAtom('O');
    const o2 = this.inventory.createAtom('O');
    reactor.addMolecule(new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]));
    
    this.addLog(`В колбу добавлены молекулы: H₂ и O₂.`);
    
    // Тик 1: Холодная колба
    this.addLog('<br><span class="text-slate-500">--- Тик 1 (Броуновское движение) ---</span>');
    const logs1 = reactor.tick();
    logs1.forEach(l => this.addLog(l));
    
    // Нагреваем колбу
    this.addLog('<br><span class="text-rose-600">🔥 Нагреваем колбу до 500K (Искра)!</span>');
    reactor.temperature = 500;
    
    // Тик 2: Горячая колба
    this.addLog('<br><span class="text-slate-500">--- Тик 2 (Броуновское движение) ---</span>');
    const logs2 = reactor.tick();
    logs2.forEach(l => this.addLog(l));
    
    // Показываем результат
    if (reactor.contents.length > 0) {
       this.molecule.set(reactor.contents[0] as Molecule);
    }
  }

  runThermodynamics() {
    this.logs.set([]);
    this.molecule.set(null);
    this.addLog('<span class="text-orange-600">>> Запуск Термодинамического Движка (Закон Гесса)</span>');
    this.addLog('Рассчитываем энтальпию горения метана: CH₄ + 2O₂ → CO₂ + 2H₂O');
    
    // 1. Создаем реагенты
    // Метан (CH4)
    const c = this.inventory.createAtom('C');
    const h1 = this.inventory.createAtom('H');
    const h2 = this.inventory.createAtom('H');
    const h3 = this.inventory.createAtom('H');
    const h4 = this.inventory.createAtom('H');
    const ch4 = new Molecule([c, h1, h2, h3, h4], [
      new CovalentBond(c, h1, 'single'),
      new CovalentBond(c, h2, 'single'),
      new CovalentBond(c, h3, 'single'),
      new CovalentBond(c, h4, 'single')
    ]);

    // Кислород (O2) - 2 штуки
    const o1 = this.inventory.createAtom('O');
    const o2 = this.inventory.createAtom('O');
    const o2_mol_1 = new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]);
    
    const o3 = this.inventory.createAtom('O');
    const o4 = this.inventory.createAtom('O');
    const o2_mol_2 = new Molecule([o3, o4], [new CovalentBond(o3, o4, 'double')]);

    const reactants = [ch4, o2_mol_1, o2_mol_2];
    
    // 2. Создаем продукты
    // Углекислый газ (CO2)
    const co2_c = this.inventory.createAtom('C');
    const co2_o1 = this.inventory.createAtom('O');
    const co2_o2 = this.inventory.createAtom('O');
    const co2 = new Molecule([co2_c, co2_o1, co2_o2], [
      new CovalentBond(co2_c, co2_o1, 'double'),
      new CovalentBond(co2_c, co2_o2, 'double')
    ]);

    // Вода (H2O) - 2 штуки
    const w1_o = this.inventory.createAtom('O');
    const w1_h1 = this.inventory.createAtom('H');
    const w1_h2 = this.inventory.createAtom('H');
    const w1 = new Molecule([w1_o, w1_h1, w1_h2], [
      new CovalentBond(w1_o, w1_h1, 'single'),
      new CovalentBond(w1_o, w1_h2, 'single')
    ]);

    const w2_o = this.inventory.createAtom('O');
    const w2_h1 = this.inventory.createAtom('H');
    const w2_h2 = this.inventory.createAtom('H');
    const w2 = new Molecule([w2_o, w2_h1, w2_h2], [
      new CovalentBond(w2_o, w2_h1, 'single'),
      new CovalentBond(w2_o, w2_h2, 'single')
    ]);

    const products = [co2, w1, w2];

    this.addLog('<br><span class="text-slate-500">--- Шаг 1: Разрыв связей (Поглощение энергии) ---</span>');
    const energyIn = reactants.reduce((sum, mol) => sum + mol.getTotalBondEnergy(), 0);
    this.addLog(`Энергия, необходимая для разрыва связей в CH₄ и 2O₂: <span class="text-rose-600 font-bold">+${energyIn} кДж/моль</span>`);

    this.addLog('<br><span class="text-slate-500">--- Шаг 2: Образование связей (Выделение энергии) ---</span>');
    const energyOut = products.reduce((sum, mol) => sum + mol.getTotalBondEnergy(), 0);
    this.addLog(`Энергия, выделяемая при образовании связей в CO₂ и 2H₂O: <span class="text-emerald-600 font-bold">-${energyOut} кДж/моль</span>`);

    this.addLog('<br><span class="text-slate-500">--- Шаг 3: Расчет Энтальпии (ΔH) ---</span>');
    const enthalpy = ThermodynamicsEngine.calculateEnthalpy(reactants, products);
    const isExo = ThermodynamicsEngine.isExothermic(reactants, products);
    
    this.addLog(`ΔH = Σ(Разрыв) - Σ(Образование) = ${energyIn} - ${energyOut} = <b>${enthalpy} кДж/моль</b>`);
    
    if (isExo) {
      this.addLog(`<span class="text-orange-600 font-bold">🔥 Реакция ЭКЗОТЕРМИЧЕСКАЯ (выделяет тепло).</span>`);
    } else {
      this.addLog(`<span class="text-blue-600 font-bold">❄️ Реакция ЭНДОТЕРМИЧЕСКАЯ (поглощает тепло).</span>`);
    }
  }

  runMolecularDynamics() {
    this.logs.set([]);
    this.molecule.set(null);
    this.addLog('<span class="text-indigo-600">>> Запуск Молекулярной Динамики (Потенциал Леннард-Джонса)</span>');
    this.addLog('Симулируем сближение двух атомов Аргона (Ar), не образующих химической связи.');
    
    const distances = [10.0, 5.0, 3.8, 3.37, 3.0, 2.5]; // Расстояния в Ангстремах (Å)
    const sigma = 3.4; // Для Аргона ~3.4 Å
    const epsilon = 0.99; // Глубина ямы для Аргона
    
    this.addLog(`<br><span class="text-slate-500">Параметры: σ = ${sigma} Å, ε = ${epsilon} кДж/моль</span><br>`);

    distances.forEach(r => {
      const potential = MolecularDynamicsEngine.calculateLennardJonesPotential(r, epsilon, sigma);
      const force = MolecularDynamicsEngine.calculateLennardJonesForce(r, epsilon, sigma);
      
      let state = '';
      let color = '';
      
      if (force > 0.5) {
        state = '💥 Сильное отталкивание (электронные оболочки столкнулись)';
        color = 'text-rose-600 font-bold';
      } else if (force < -0.05) {
        state = '🧲 Притяжение (Ван-дер-Ваальсовы силы)';
        color = 'text-blue-600';
      } else if (Math.abs(force) <= 0.05 && r < 5) {
        state = '✨ Идеальный баланс (Дно потенциальной ямы)';
        color = 'text-emerald-600 font-bold';
      } else {
        state = '💨 Атомы не чувствуют друг друга';
        color = 'text-slate-500';
      }

      this.addLog(`Расстояние <b>${r.toFixed(2)} Å</b>:`);
      this.addLog(`  Энергия: ${potential.toFixed(3)} | Сила: <span class="${color}">${force.toFixed(3)}</span>`);
      this.addLog(`  Статус: <span class="${color}">${state}</span><br>`);
    });
    
    this.addLog(`<i>Вывод: Именно этот алгоритм заставляет белки сворачиваться в правильную 3D-структуру (фолдинг), а воду — собираться в капли.</i>`);
  }

  runSimulation(type: 'water' | 'co2') {
    this.logs.set([]);
    this.molecule.set(null);
    
    if (type === 'water') {
      this.addLog('<span class="text-blue-600">>> Инициализация H₂O (Угловая геометрия)...</span>');
      
      // Используем инвентарь и задаем позиции
      const oxygen = this.inventory.createAtom('O');
      oxygen.position = { x: 0, y: 0 };
      
      const hydrogen1 = this.inventory.createAtom('H');
      hydrogen1.position = { x: -1, y: -1 };
      
      const hydrogen2 = this.inventory.createAtom('H');
      hydrogen2.position = { x: 1, y: -1 };
      
      this.addLog(`Создан объект: <b>${oxygen.symbol}</b> в координатах (0, 0)`);
      this.addLog(`Создан объект: <b>${hydrogen1.symbol}</b> в координатах (-1, -1)`);
      this.addLog(`Создан объект: <b>${hydrogen2.symbol}</b> в координатах (1, -1)`);
      
      const bond1 = new CovalentBond(oxygen, hydrogen1, 'single');
      const bond2 = new CovalentBond(oxygen, hydrogen2, 'single');
      
      const v1 = bond1.getDipoleVector();
      const v2 = bond2.getDipoleVector();
      
      this.addLog(`Вектор связи O-H (1): x=${v1.x.toFixed(2)}, y=${v1.y.toFixed(2)}`);
      this.addLog(`Вектор связи O-H (2): x=${v2.x.toFixed(2)}, y=${v2.y.toFixed(2)}`);
      
      const water = new Molecule([oxygen, hydrogen1, hydrogen2], [bond1, bond2]);
      const net = water.getNetDipoleMoment();
      
      this.addLog(`<span class="text-rose-600">Сумма векторов: x=${net.x.toFixed(2)}, y=${net.y.toFixed(2)}</span>`);
      this.addLog(`Векторы не компенсируют друг друга. Молекула полярна!`);
      
      setTimeout(() => this.molecule.set(water), 500);

    } else {
      this.addLog('<span class="text-blue-600">>> Инициализация CO₂ (Линейная геометрия)...</span>');
      
      const carbon = this.inventory.createAtom('C');
      carbon.position = { x: 0, y: 0 };
      
      const oxygen1 = this.inventory.createAtom('O');
      oxygen1.position = { x: -2, y: 0 };
      
      const oxygen2 = this.inventory.createAtom('O');
      oxygen2.position = { x: 2, y: 0 };
      
      this.addLog(`Создан объект: <b>${carbon.symbol}</b> в координатах (0, 0)`);
      this.addLog(`Создан объект: <b>${oxygen1.symbol}</b> в координатах (-2, 0)`);
      this.addLog(`Создан объект: <b>${oxygen2.symbol}</b> в координатах (2, 0)`);
      
      const bond1 = new CovalentBond(carbon, oxygen1, 'double');
      const bond2 = new CovalentBond(carbon, oxygen2, 'double');
      
      const v1 = bond1.getDipoleVector();
      const v2 = bond2.getDipoleVector();
      
      this.addLog(`Вектор связи C=O (1): x=${v1.x.toFixed(2)}, y=${v1.y.toFixed(2)}`);
      this.addLog(`Вектор связи C=O (2): x=${v2.x.toFixed(2)}, y=${v2.y.toFixed(2)}`);
      
      const co2 = new Molecule([carbon, oxygen1, oxygen2], [bond1, bond2]);
      const net = co2.getNetDipoleMoment();
      
      this.addLog(`<span class="text-emerald-600">Сумма векторов: x=${net.x.toFixed(2)}, y=${net.y.toFixed(2)}</span>`);
      this.addLog(`Векторы направлены в противоположные стороны и обнуляются. Молекула НЕ полярна!`);
      
      setTimeout(() => this.molecule.set(co2), 500);
    }
  }

  private addLog(msg: string) {
    this.logs.update(prev => [...prev, msg]);
  }
}
