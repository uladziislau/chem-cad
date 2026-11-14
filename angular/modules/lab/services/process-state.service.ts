import { Injectable, signal, computed, inject } from '@angular/core';
import { ManufacturingProcess, ProcessStep, OperationType, validateProcessStep } from '@root-modules/engine/process-step.interface';
import { ChemicalEngine, SimulationResult } from '@root-modules/engine/chemical-engine';
import { RawIngredientInput } from '@root-modules/engine/types';
import { ProcessPersistenceService } from './process-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessStateService {
  private persistence = inject(ProcessPersistenceService);

  public readonly currentProcess = signal<ManufacturingProcess>({
    id: 'proc_default',
    name: 'Новый технологический процесс',
    steps: [],
    createdAt: new Date()
  });

  public readonly activeStepIndex = signal<number>(0);

  constructor() {
    const restored = this.persistence.load();
    if (restored) {
      this.currentProcess.set(restored);
    }
  }

  // --- Computed ---

  public readonly simulationResults = computed<SimulationResult[]>(() => {
    const proc = this.currentProcess();
    if (proc.steps.length === 0) return [];
    return ChemicalEngine.runProcess(proc);
  });

  public readonly currentStepResult = computed(() => {
    const results = this.simulationResults();
    const index = this.activeStepIndex();
    return results[index] || null;
  });

  /** Карта stepId → список ошибок валидации (только невалидные шаги). */
  public readonly stepIssues = computed(() => {
    const map = new Map<string, string[]>();
    for (const step of this.currentProcess().steps) {
      const issues = validateProcessStep(step);
      if (issues.length > 0) map.set(step.id, issues);
    }
    return map;
  });

  // --- Actions ---

  addStep(operation: OperationType) {
    const newStep: ProcessStep = {
      id: crypto.randomUUID(),
      name: this.getDefaultStepName(operation),
      operation,
      durationMinutes: 10,
      rpm: operation === 'EMULSIFY' ? 5000 : (operation === 'MIX' ? 1000 : 0),
      targetTemperature: 25
    };

    this.currentProcess.update(p => ({
      ...p,
      steps: [...p.steps, newStep]
    }));
    
    this.activeStepIndex.set(this.currentProcess().steps.length - 1);
    this.persistence.save(this.currentProcess());
  }

  updateStep(stepId: string, updates: Partial<ProcessStep>) {
    this.currentProcess.update(p => ({
      ...p,
      steps: p.steps.map((s: ProcessStep) => s.id === stepId ? { ...s, ...updates } : s)
    }));
    this.persistence.save(this.currentProcess());
  }

  removeStep(stepId: string) {
    this.currentProcess.update(p => ({
      ...p,
      steps: p.steps.filter((s: ProcessStep) => s.id !== stepId)
    }));

    if (this.activeStepIndex() >= this.currentProcess().steps.length) {
      this.activeStepIndex.set(Math.max(0, this.currentProcess().steps.length - 1));
    }
    this.persistence.save(this.currentProcess());
  }

  /** Перемещает шаг с fromIndex на toIndex, сохраняя ссылку на активный шаг. */
  moveStep(fromIndex: number, toIndex: number) {
    const steps = this.currentProcess().steps;
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 ||
        fromIndex >= steps.length || toIndex >= steps.length) return;

    const activeId = steps[this.activeStepIndex()]?.id;
    const next = [...steps];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    this.currentProcess.update(p => ({ ...p, steps: next }));

    const newActive = next.findIndex(s => s.id === activeId);
    this.activeStepIndex.set(newActive >= 0 ? newActive : 0);
    this.persistence.save(this.currentProcess());
  }

  addIngredientsToStep(stepId: string, ingredients: RawIngredientInput[]) {
    this.currentProcess.update(p => ({
      ...p,
      steps: p.steps.map((s: ProcessStep) => s.id === stepId ? {
        ...s,
        ingredients: [...(s.ingredients || []), ...ingredients]
      } : s)
    }));
    this.persistence.save(this.currentProcess());
  }

  private getDefaultStepName(op: OperationType): string {
    switch (op) {
      case 'ADD': return 'Добавление компонентов';
      case 'MIX': return 'Перемешивание';
      case 'HEAT': return 'Нагрев';
      case 'COOL': return 'Охлаждение';
      case 'EMULSIFY': return 'Гомогенизация (Эмульгирование)';
      case 'HOLD': return 'Выдержка';
      default: return 'Новая операция';
    }
  }
}
