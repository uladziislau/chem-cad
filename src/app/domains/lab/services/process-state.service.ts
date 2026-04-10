import { Injectable, signal, computed } from '@angular/core';
import { ManufacturingProcess, ProcessStep, OperationType } from '../../../../core/engine/process-step.interface';
import { ChemicalEngine, SimulationResult } from '../../../../core/engine/chemical-engine';
import { RawIngredientInput } from '../../../../core/engine/types';

@Injectable({
  providedIn: 'root'
})
export class ProcessStateService {
  public readonly currentProcess = signal<ManufacturingProcess>({
    id: 'proc_default',
    name: 'Новый технологический процесс',
    steps: [],
    createdAt: new Date()
  });

  public readonly activeStepIndex = signal<number>(0);

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

  // --- Actions ---

  addStep(operation: OperationType) {
    const newStep: ProcessStep = {
      id: `step_${Date.now()}`,
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
  }

  updateStep(stepId: string, updates: Partial<ProcessStep>) {
    this.currentProcess.update(p => ({
      ...p,
      steps: p.steps.map((s: ProcessStep) => s.id === stepId ? { ...s, ...updates } : s)
    }));
  }

  removeStep(stepId: string) {
    this.currentProcess.update(p => ({
      ...p,
      steps: p.steps.filter((s: ProcessStep) => s.id !== stepId)
    }));
    
    if (this.activeStepIndex() >= this.currentProcess().steps.length) {
      this.activeStepIndex.set(Math.max(0, this.currentProcess().steps.length - 1));
    }
  }

  addIngredientsToStep(stepId: string, ingredients: RawIngredientInput[]) {
    this.currentProcess.update(p => ({
      ...p,
      steps: p.steps.map((s: ProcessStep) => s.id === stepId ? { 
        ...s, 
        ingredients: [...(s.ingredients || []), ...ingredients] 
      } : s)
    }));
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
