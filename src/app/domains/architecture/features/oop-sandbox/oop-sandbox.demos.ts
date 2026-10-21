import { signal, WritableSignal } from '@angular/core';
import { ChemistryInventoryService } from '../../services/chemistry-inventory.service';
import { SmilesParserService } from '../../services/smiles-parser.service';
import { CovalentBond, Molecule, SynthesisReaction, Reactor, HydrogenCombustionMechanism, ThermodynamicsEngine } from '../../models';

export interface OopSandboxContext {
  logs: ReturnType<typeof signal<string[]>>;
  molecule: WritableSignal<unknown>;
  inventory: ChemistryInventoryService;
  smilesParser: SmilesParserService;
  liveReactor: unknown;
  liveTemp: () => number;
  liveMoleculeCount: (v: number) => void;
  addLog: (msg: string) => void;
}

export function runReaction(ctx: OopSandboxContext): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    ctx.addLog('<span class="text-blue-600">>> Запуск IReaction: 2H₂ + O₂ → 2H₂O</span>');

    // Используем инвентарь
    const h1 = ctx.inventory.createAtom('H');
    const h2 = ctx.inventory.createAtom('H');
    const h2_mol = new Molecule([h1, h2], [new CovalentBond(h1, h2, 'single')]);

    const o1 = ctx.inventory.createAtom('O');
    const o2 = ctx.inventory.createAtom('O');
    const o2_mol = new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]);

    ctx.addLog(`Реагенты готовы: 2 объекта H₂ и 1 объект O₂ (из Inventory)`);

    // Создаем продукт
    const water_o = ctx.inventory.createAtom('O');
    const water_h1 = ctx.inventory.createAtom('H');
    const water_h2 = ctx.inventory.createAtom('H');
    const water_mol = new Molecule([water_o, water_h1, water_h2], [
      new CovalentBond(water_o, water_h1, 'single'),
      new CovalentBond(water_o, water_h2, 'single')
    ]);

    ctx.addLog('<br><span class="text-blue-600">>> Проверка условий IEnvironment...</span>');
    const env = { temperature: 500, pressure: 1 };
    ctx.addLog(`Температура среды: ${env.temperature}K`);

    const reaction = new SynthesisReaction([h2_mol, h2_mol, o2_mol], [water_mol, water_mol]);
    
    if (reaction.isPossible(env)) {
      ctx.addLog(`<span class="text-emerald-600">✓ reaction.isPossible(env) == true</span>`);
      const result = reaction.execute();
      ctx.addLog(`<b>Реакция выполнена!</b>`);
      ctx.addLog(`Выделено энергии (ΔE): ${result.energyReleased} кДж/моль`);
      ctx.molecule.set(water_mol);
    }
  }

export function runVirtualLab(ctx: OopSandboxContext): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    ctx.addLog('<span class="text-teal-600">>> Запуск Виртуальной Колбы (Эмерджентность)</span>');
    
    // Создаем колбу
    const reactor = new Reactor(298, 1, 1); // 298K (комнатная температура)
    reactor.addMechanism(new HydrogenCombustionMechanism());
    
    ctx.addLog(`Создана колба. Температура: ${reactor.temperature}K. Добавлен механизм: Горение водорода.`);
    
    // Наполняем колбу газами
    const h1 = ctx.inventory.createAtom('H');
    const h2 = ctx.inventory.createAtom('H');
    reactor.addMolecule(new Molecule([h1, h2], [new CovalentBond(h1, h2, 'single')]));
    
    const o1 = ctx.inventory.createAtom('O');
    const o2 = ctx.inventory.createAtom('O');
    reactor.addMolecule(new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]));
    
    ctx.addLog(`В колбу добавлены молекулы: H₂ и O₂.`);
    
    // Тик 1: Холодная колба
    ctx.addLog('<br><span class="text-slate-500">--- Тик 1 (Броуновское движение) ---</span>');
    const logs1 = reactor.tick();
    logs1.forEach(l => ctx.addLog(l));
    
    // Нагреваем колбу
    ctx.addLog('<br><span class="text-rose-600">🔥 Нагреваем колбу до 500K (Искра)!</span>');
    reactor.temperature = 500;
    
    // Тик 2: Горячая колба
    ctx.addLog('<br><span class="text-slate-500">--- Тик 2 (Броуновское движение) ---</span>');
    const logs2 = reactor.tick();
    logs2.forEach(l => ctx.addLog(l));
    
    // Показываем результат
    if (reactor.contents.length > 0) {
       ctx.molecule.set(reactor.contents[0] as Molecule);
    }
  }

export function runThermodynamics(ctx: OopSandboxContext): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    ctx.addLog('<span class="text-orange-600">>> Запуск Термодинамического Движка (Закон Гесса)</span>');
    ctx.addLog('Рассчитываем энтальпию горения метана: CH₄ + 2O₂ → CO₂ + 2H₂O');
    
    // 1. Создаем реагенты
    // Метан (CH4)
    const c = ctx.inventory.createAtom('C');
    const h1 = ctx.inventory.createAtom('H');
    const h2 = ctx.inventory.createAtom('H');
    const h3 = ctx.inventory.createAtom('H');
    const h4 = ctx.inventory.createAtom('H');
    const ch4 = new Molecule([c, h1, h2, h3, h4], [
      new CovalentBond(c, h1, 'single'),
      new CovalentBond(c, h2, 'single'),
      new CovalentBond(c, h3, 'single'),
      new CovalentBond(c, h4, 'single')
    ]);

    // Кислород (O2) - 2 штуки
    const o1 = ctx.inventory.createAtom('O');
    const o2 = ctx.inventory.createAtom('O');
    const o2_mol_1 = new Molecule([o1, o2], [new CovalentBond(o1, o2, 'double')]);
    
    const o3 = ctx.inventory.createAtom('O');
    const o4 = ctx.inventory.createAtom('O');
    const o2_mol_2 = new Molecule([o3, o4], [new CovalentBond(o3, o4, 'double')]);

    const reactants = [ch4, o2_mol_1, o2_mol_2];
    
    // 2. Создаем продукты
    // Углекислый газ (CO2)
    const co2_c = ctx.inventory.createAtom('C');
    const co2_o1 = ctx.inventory.createAtom('O');
    const co2_o2 = ctx.inventory.createAtom('O');
    const co2 = new Molecule([co2_c, co2_o1, co2_o2], [
      new CovalentBond(co2_c, co2_o1, 'double'),
      new CovalentBond(co2_c, co2_o2, 'double')
    ]);

    // Вода (H2O) - 2 штуки
    const w1_o = ctx.inventory.createAtom('O');
    const w1_h1 = ctx.inventory.createAtom('H');
    const w1_h2 = ctx.inventory.createAtom('H');
    const w1 = new Molecule([w1_o, w1_h1, w1_h2], [
      new CovalentBond(w1_o, w1_h1, 'single'),
      new CovalentBond(w1_o, w1_h2, 'single')
    ]);

    const w2_o = ctx.inventory.createAtom('O');
    const w2_h1 = ctx.inventory.createAtom('H');
    const w2_h2 = ctx.inventory.createAtom('H');
    const w2 = new Molecule([w2_o, w2_h1, w2_h2], [
      new CovalentBond(w2_o, w2_h1, 'single'),
      new CovalentBond(w2_o, w2_h2, 'single')
    ]);

    const products = [co2, w1, w2];

    ctx.addLog('<br><span class="text-slate-500">--- Шаг 1: Разрыв связей (Поглощение энергии) ---</span>');
    const energyIn = reactants.reduce((sum, mol) => sum + mol.getTotalBondEnergy(), 0);
    ctx.addLog(`Энергия, необходимая для разрыва связей в CH₄ и 2O₂: <span class="text-rose-600 font-bold">+${energyIn} кДж/моль</span>`);

    ctx.addLog('<br><span class="text-slate-500">--- Шаг 2: Образование связей (Выделение энергии) ---</span>');
    const energyOut = products.reduce((sum, mol) => sum + mol.getTotalBondEnergy(), 0);
    ctx.addLog(`Энергия, выделяемая при образовании связей в CO₂ и 2H₂O: <span class="text-emerald-600 font-bold">-${energyOut} кДж/моль</span>`);

    ctx.addLog('<br><span class="text-slate-500">--- Шаг 3: Расчет Энтальпии (ΔH) ---</span>');
    const enthalpy = ThermodynamicsEngine.calculateEnthalpy(reactants, products);
    const isExo = ThermodynamicsEngine.isExothermic(reactants, products);
    
    ctx.addLog(`ΔH = Σ(Разрыв) - Σ(Образование) = ${energyIn} - ${energyOut} = <b>${enthalpy} кДж/моль</b>`);
    
    if (isExo) {
      ctx.addLog(`<span class="text-orange-600 font-bold">🔥 Реакция ЭКЗОТЕРМИЧЕСКАЯ (выделяет тепло).</span>`);
    } else {
      ctx.addLog(`<span class="text-blue-600 font-bold">❄️ Реакция ЭНДОТЕРМИЧЕСКАЯ (поглощает тепло).</span>`);
    }
  }

export function runSimulation(ctx: OopSandboxContext, type: 'water' | 'co2'): void {
    ctx.logs.set([]);
    ctx.molecule.set(null);
    
    if (type === 'water') {
      ctx.addLog('<span class="text-blue-600">>> Инициализация H₂O (Угловая геометрия)...</span>');
      
      // Используем инвентарь и задаем позиции
      const oxygen = ctx.inventory.createAtom('O');
      oxygen.position = { x: 0, y: 0 };
      
      const hydrogen1 = ctx.inventory.createAtom('H');
      hydrogen1.position = { x: -1, y: -1 };
      
      const hydrogen2 = ctx.inventory.createAtom('H');
      hydrogen2.position = { x: 1, y: -1 };
      
      ctx.addLog(`Создан объект: <b>${oxygen.symbol}</b> в координатах (0, 0)`);
      ctx.addLog(`Создан объект: <b>${hydrogen1.symbol}</b> в координатах (-1, -1)`);
      ctx.addLog(`Создан объект: <b>${hydrogen2.symbol}</b> в координатах (1, -1)`);
      
      const bond1 = new CovalentBond(oxygen, hydrogen1, 'single');
      const bond2 = new CovalentBond(oxygen, hydrogen2, 'single');
      
      const v1 = bond1.getDipoleVector();
      const v2 = bond2.getDipoleVector();
      
      ctx.addLog(`Вектор связи O-H (1): x=${v1.x.toFixed(2)}, y=${v1.y.toFixed(2)}`);
      ctx.addLog(`Вектор связи O-H (2): x=${v2.x.toFixed(2)}, y=${v2.y.toFixed(2)}`);
      
      const water = new Molecule([oxygen, hydrogen1, hydrogen2], [bond1, bond2]);
      const net = water.getNetDipoleMoment();
      
      ctx.addLog(`<span class="text-rose-600">Сумма векторов: x=${net.x.toFixed(2)}, y=${net.y.toFixed(2)}</span>`);
      ctx.addLog(`Векторы не компенсируют друг друга. Молекула полярна!`);
      
      setTimeout(() => ctx.molecule.set(water), 500);

    } else {
      ctx.addLog('<span class="text-blue-600">>> Инициализация CO₂ (Линейная геометрия)...</span>');
      
      const carbon = ctx.inventory.createAtom('C');
      carbon.position = { x: 0, y: 0 };
      
      const oxygen1 = ctx.inventory.createAtom('O');
      oxygen1.position = { x: -2, y: 0 };
      
      const oxygen2 = ctx.inventory.createAtom('O');
      oxygen2.position = { x: 2, y: 0 };
      
      ctx.addLog(`Создан объект: <b>${carbon.symbol}</b> в координатах (0, 0)`);
      ctx.addLog(`Создан объект: <b>${oxygen1.symbol}</b> в координатах (-2, 0)`);
      ctx.addLog(`Создан объект: <b>${oxygen2.symbol}</b> в координатах (2, 0)`);
      
      const bond1 = new CovalentBond(carbon, oxygen1, 'double');
      const bond2 = new CovalentBond(carbon, oxygen2, 'double');
      
      const v1 = bond1.getDipoleVector();
      const v2 = bond2.getDipoleVector();
      
      ctx.addLog(`Вектор связи C=O (1): x=${v1.x.toFixed(2)}, y=${v1.y.toFixed(2)}`);
      ctx.addLog(`Вектор связи C=O (2): x=${v2.x.toFixed(2)}, y=${v2.y.toFixed(2)}`);
      
      const co2 = new Molecule([carbon, oxygen1, oxygen2], [bond1, bond2]);
      const net = co2.getNetDipoleMoment();
      
      ctx.addLog(`<span class="text-emerald-600">Сумма векторов: x=${net.x.toFixed(2)}, y=${net.y.toFixed(2)}</span>`);
      ctx.addLog(`Векторы направлены в противоположные стороны и обнуляются. Молекула НЕ полярна!`);
      
      setTimeout(() => ctx.molecule.set(co2), 500);
    }
  }
