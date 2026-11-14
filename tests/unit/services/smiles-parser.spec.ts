import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { SmilesParserService } from '@modules/architecture/services/smiles-parser.service';
import { ChemistryInventoryService } from '@modules/architecture/services/chemistry-inventory.service';
import { ChemEventBusService, SystemEventType, SystemEvent } from '@modules/architecture/services/chem-event-bus.service';
import { Molecule } from '@root-modules/architecture/models';

/**
 * Юнит-тесты SMILES-парсера.
 * Сервис Angular, но чистая логика — поднимаем через EnvironmentInjector
 * с явными провайдерами (без TestBed/zone.js).
 */
describe('SmilesParserService', () => {
  let service: SmilesParserService;
  let eventBus: ChemEventBusService;

  beforeEach(() => {
    const injector = createEnvironmentInjector(
      [SmilesParserService, ChemistryInventoryService, ChemEventBusService],
      null as unknown as EnvironmentInjector
    );
    service = injector.get(SmilesParserService);
    eventBus = injector.get(ChemEventBusService);
  });

  describe('базовые цепочки', () => {
    it('этанол CCO → 3 атома, 2 одинарные связи', () => {
      const mol = service.parse('CCO');
      expect(mol).toBeInstanceOf(Molecule);
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'C', 'O']);
      expect(mol.bonds).toHaveLength(2);
      expect(mol.bonds.every(b => b.type === 'single')).toBe(true);
    });

    it('метан CH4 → 2 атома, 1 связь C-H', () => {
      const mol = service.parse('CH');
      expect(mol.atoms).toHaveLength(2);
      expect(mol.bonds).toHaveLength(1);
      expect(mol.bonds[0].energy).toBe(413); // C-H_single
    });

    it('пустая строка → пустая молекула', () => {
      const mol = service.parse('');
      expect(mol.atoms).toHaveLength(0);
      expect(mol.bonds).toHaveLength(0);
    });

    it('пробелы игнорируются', () => {
      const mol = service.parse('  C C   O  ');
      expect(mol.atoms).toHaveLength(3);
      expect(mol.bonds).toHaveLength(2);
    });
  });

  describe('кратность связей', () => {
    it('формальдегид C=O → двойная связь', () => {
      const mol = service.parse('C=O');
      expect(mol.bonds).toHaveLength(1);
      expect(mol.bonds[0].type).toBe('double');
      expect(mol.bonds[0].energy).toBe(799); // C-O_double
    });

    it('синильная кислота C#N → тройная связь', () => {
      const mol = service.parse('C#N');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'N']);
      expect(mol.bonds[0].type).toBe('triple');
    });

    it('тип связи сбрасывается после использования', () => {
      // C=CC: двойная только между первыми двумя атомами
      const mol = service.parse('C=CC');
      expect(mol.bonds[0].type).toBe('double');
      expect(mol.bonds[1].type).toBe('single');
    });
  });

  describe('ветвления', () => {
    it('изобутанол CC(C)O → 4 атома, 3 связи', () => {
      const mol = service.parse('CC(C)O');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'C', 'C', 'O']);
      expect(mol.bonds).toHaveLength(3);
    });

    it('ветка возвращает currentAtom на родителя', () => {
      // CC(C)O: O должен быть связан с центральным C (atom1), а не с атомом ветки (atom2)
      const mol = service.parse('CC(C)O');
      const oBond = mol.bonds.find(b =>
        b.atomA.symbol === 'O' || b.atomB.symbol === 'O'
      );
      expect(oBond).toBeDefined();
      const other = oBond!.atomA.symbol === 'O' ? oBond!.atomB : oBond!.atomA;
      // O соединён с atom1 (второй C в цепочке), не с atom2 (ветка)
      expect(mol.atoms.indexOf(other)).toBe(1);
    });

    it('вложенные ветки CC(C)(C)O → 5 атомов, 4 связи', () => {
      const mol = service.parse('CC(C)(C)O');
      expect(mol.atoms).toHaveLength(5);
      expect(mol.bonds).toHaveLength(4);
    });
  });

  describe('кольца', () => {
    it('циклопропан C1CC1 → 3 атома, 3 связи', () => {
      const mol = service.parse('C1CC1');
      expect(mol.atoms).toHaveLength(3);
      expect(mol.bonds).toHaveLength(3);
      expect(mol.bonds.every(b => b.type === 'single')).toBe(true);
    });

    it('бензол c1ccccc1 → 6 атомов C, 6 связей', () => {
      const mol = service.parse('c1ccccc1');
      expect(mol.atoms).toHaveLength(6);
      expect(mol.atoms.every(a => a.symbol === 'C')).toBe(true);
      expect(mol.bonds).toHaveLength(6);
    });

    it('пиридин c1ccncc1 → 5 C + 1 N, 6 связей', () => {
      const mol = service.parse('c1ccncc1');
      expect(mol.atoms).toHaveLength(6);
      expect(mol.atoms.filter(a => a.symbol === 'N')).toHaveLength(1);
      expect(mol.bonds).toHaveLength(6);
    });

    it('два независимых кольца в одной молекуле', () => {
      // бицикл: два кольца с разными цифрами
      const mol = service.parse('C1CC1C2CC2');
      expect(mol.atoms).toHaveLength(6);
      expect(mol.bonds).toHaveLength(7); // 3+3 кольцевых + 1 связка
    });
  });

  describe('двухбуквенные элементы и ароматика', () => {
    it('хлорметан CCl → Cl распознаётся как один элемент', () => {
      const mol = service.parse('CCl');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'Cl']);
      expect(mol.bonds).toHaveLength(1);
    });

    it('бромэтан CBr → Br', () => {
      const mol = service.parse('CBr');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'Br']);
    });

    it('ароматические атомы подряд не склеиваются (cc ≠ Cc)', () => {
      // Регрессия: 'cc' раньше читалось как несуществующий 'Cc'
      const mol = service.parse('cnc');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'N', 'C']);
      expect(mol.bonds).toHaveLength(2);
    });
  });

  describe('неизвестные элементы', () => {
    it('Xe отсутствует в инвентаре → атом пропускается', () => {
      const mol = service.parse('CXe');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C']);
      expect(mol.bonds).toHaveLength(0);
    });

    it('пропущенный элемент не разрывает цепочку', () => {
      // CXeO: Xe пропущен, O должен связаться с C
      const mol = service.parse('CXeO');
      expect(mol.atoms.map(a => a.symbol)).toEqual(['C', 'O']);
      expect(mol.bonds).toHaveLength(1);
      expect(mol.bonds[0].energy).toBe(358); // C-O_single
    });
  });

  describe('событие MOLECULE_PARSED', () => {
    it('dispatch отправляет событие с метаданными', () => {
      const events: SystemEvent<{ smiles: string; atomsCount: number; bondsCount: number }>[] = [];
      const sub = eventBus.on<{ smiles: string; atomsCount: number; bondsCount: number }>(SystemEventType.MOLECULE_PARSED).subscribe(e => events.push(e));

      service.parse('CCO');
      sub.unsubscribe();

      expect(events).toHaveLength(1);
      expect(events[0].payload.smiles).toBe('CCO');
      expect(events[0].payload.atomsCount).toBe(3);
      expect(events[0].payload.bondsCount).toBe(2);
      expect(events[0].sourceNode).toBe('TopologyNode(SMILES)');
    });
  });

  describe('производные Molecule', () => {
    it('getFormula для этанола → CCO...', () => {
      const mol = service.parse('CCO');
      expect(mol.getFormula()).toBe('C₂O'); // C×2 → подстрочный индекс
    });

    it('getMolecularMass суммирует массы атомов', () => {
      const mol = service.parse('CO'); // метанол CH3OH упрощённо — тут C+O
      const mass = mol.getMolecularMass();
      expect(mass).toBeCloseTo(12.011 + 15.999, 3);
    });
  });
});
