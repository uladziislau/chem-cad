import { OopSandboxContext } from './oop-sandbox.demos';
import { CovalentBond, MoleculeGraph, AtomNode, BondEdge, Orbital, Electron, Spin, Sp3Hybridization, MolecularDynamicsEngine } from '../../models';


export function runGraphAnalysis(ctx: OopSandboxContext): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    ctx.addLog('<span class="text-amber-600">>> Запуск Топологического Анализа (Теория Графов)</span>');
    
    const graph = new MoleculeGraph();
    
    // Создаем циклогексан (C6H12) - упрощенно только углеродный скелет для демо
    ctx.addLog('Создаем углеродный скелет Циклогексана (кольцо из 6 атомов C)...');
    
    const carbons: AtomNode[] = [];
    for (let i = 0; i < 6; i++) {
      const c = ctx.inventory.createAtom('C');
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
      ctx.addLog(`Добавлено ребро (Связь): ${carbons[i].id} — ${carbons[nextIdx].id}`);
    }
    
    ctx.addLog('<br><span class="text-amber-600">>> Запуск алгоритма DFS (Поиск в глубину)...</span>');
    const hasCycles = graph.hasCycles();
    
    if (hasCycles) {
      ctx.addLog(`<span class="text-emerald-600 font-bold">✓ Алгоритм обнаружил цикл!</span>`);
      ctx.addLog(`Вывод: Молекула является циклической (алициклической или ароматической).`);
    } else {
      ctx.addLog(`Циклов не найдено. Молекула алифатическая (линейная).`);
    }
    
    ctx.addLog(`<br>Статистика графа:`);
    ctx.addLog(`Узлов (Атомов): ${graph.getNodes().length}`);
    ctx.addLog(`Ребер (Связей): ${graph.getEdges().length}`);
    ctx.addLog(`Степень вершины C0: ${graph.getDegree('C0')} (связей в скелете)`);
  }

export function runQuantumDemo(ctx: OopSandboxContext): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    ctx.addLog('<span class="text-purple-600">>> Запуск Квантово-механической модели (Углерод)</span>');
    
    ctx.addLog('Создаем валентные орбитали атома Углерода в основном состоянии (Ground State)...');
    
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
    
    ctx.addLog(`<br><b>Основное состояние (Ground State):</b>`);
    ctx.addLog(`[${sOrbital.name}] Электронов: ${sOrbital.electrons.length} (Неспаренных: ${sOrbital.hasUnpaired() ? 1 : 0})`);
    ctx.addLog(`[${px.name}] Электронов: ${px.electrons.length} (Неспаренных: ${px.hasUnpaired() ? 1 : 0})`);
    ctx.addLog(`[${py.name}] Электронов: ${py.electrons.length} (Неспаренных: ${py.hasUnpaired() ? 1 : 0})`);
    ctx.addLog(`[${pz.name}] Электронов: ${pz.electrons.length} (Неспаренных: ${pz.hasUnpaired() ? 1 : 0})`);
    
    const initialUnpaired = [sOrbital, ...pOrbitals].filter(o => o.hasUnpaired()).length;
    ctx.addLog(`<span class="text-rose-600">Валентность (кол-во неспаренных электронов): ${initialUnpaired}</span>`);
    ctx.addLog(`<i>Вывод: В основном состоянии углерод может образовать только 2 связи. Но в органике он всегда 4-хвалентен! Как?</i>`);
    
    ctx.addLog('<br><span class="text-purple-600">>> Применяем Паттерн Стратегия: Sp3Hybridization...</span>');
    
    const strategy = new Sp3Hybridization();
    const hybridOrbitals = strategy.hybridize(sOrbital, pOrbitals);
    
    ctx.addLog(`<br><b>Гибридизированное состояние (Excited State):</b>`);
    let finalUnpaired = 0;
    hybridOrbitals.forEach((orb, i) => {
      ctx.addLog(`[${orb.name} #${i+1}] Электронов: ${orb.electrons.length} (Неспаренных: ${orb.hasUnpaired() ? 1 : 0})`);
      if (orb.hasUnpaired()) finalUnpaired++;
    });
    
    ctx.addLog(`<span class="text-emerald-600 font-bold">Новая валентность: ${finalUnpaired}</span>`);
    ctx.addLog(`<i>Вывод: 1 s-орбиталь и 3 p-орбитали "смешались", образовав 4 одинаковые sp³ орбитали. Теперь углерод готов образовать 4 связи (например, Метан CH₄)!</i>`);
  }

export function runMolecularDynamics(ctx: OopSandboxContext): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    ctx.addLog('<span class="text-indigo-600">>> Запуск Молекулярной Динамики (Потенциал Леннард-Джонса)</span>');
    ctx.addLog('Симулируем сближение двух атомов Аргона (Ar), не образующих химической связи.');
    
    const distances = [10.0, 5.0, 3.8, 3.37, 3.0, 2.5]; // Расстояния в Ангстремах (Å)
    const sigma = 3.4; // Для Аргона ~3.4 Å
    const epsilon = 0.99; // Глубина ямы для Аргона
    
    ctx.addLog(`<br><span class="text-slate-500">Параметры: σ = ${sigma} Å, ε = ${epsilon} кДж/моль</span><br>`);

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

      ctx.addLog(`Расстояние <b>${r.toFixed(2)} Å</b>:`);
      ctx.addLog(`  Энергия: ${potential.toFixed(3)} | Сила: <span class="${color}">${force.toFixed(3)}</span>`);
      ctx.addLog(`  Статус: <span class="${color}">${state}</span><br>`);
    });
    
    ctx.addLog(`<i>Вывод: Именно этот алгоритм заставляет белки сворачиваться в правильную 3D-структуру (фолдинг), а воду — собираться в капли.</i>`);
  }
