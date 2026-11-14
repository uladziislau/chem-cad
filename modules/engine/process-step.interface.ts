import { RawIngredientInput } from './types';

export type OperationType = 'ADD' | 'MIX' | 'HEAT' | 'COOL' | 'EMULSIFY' | 'HOLD';

/**
 * Описание одной технологической операции (Unit Operation).
 */
export interface ProcessStep {
    id: string;
    name: string;
    operation: OperationType;
    
    /** Список ингредиентов, добавляемых на этом этапе */
    ingredients?: RawIngredientInput[];
    
    /** Целевая температура (°C) для нагрева/охлаждения */
    targetTemperature?: number;
    
    /** Скорость перемешивания (RPM) */
    rpm?: number;
    
    /** Длительность этапа (минуты) */
    durationMinutes: number;
    
    /** Описание или инструкции для технолога */
    instructions?: string;
}

/**
 * Полный технологический процесс (Manufacturing Process).
 */
export interface ManufacturingProcess {
    id: string;
    name: string;
    steps: ProcessStep[];
    createdAt: Date;
}

/**
 * Ошибки валидации одного шага процесса.
 * Пустой массив — шаг валиден.
 */
export function validateProcessStep(step: ProcessStep): string[] {
  const issues: string[] = [];

  if (!step.name || !step.name.trim()) {
    issues.push('Название этапа не может быть пустым');
  }
  if (!Number.isFinite(step.durationMinutes) || step.durationMinutes <= 0) {
    issues.push('Длительность должна быть положительным числом минут');
  }
  if (step.targetTemperature !== undefined && !Number.isFinite(step.targetTemperature)) {
    issues.push('Целевая температура должна быть числом');
  }
  if (step.rpm !== undefined && (!Number.isFinite(step.rpm) || step.rpm < 0)) {
    issues.push('Скорость вращения должна быть неотрицательным числом');
  }
  for (const ing of step.ingredients ?? []) {
    if (!Number.isFinite(ing.massGrams) || ing.massGrams <= 0) {
      issues.push(`Некорректная масса компонента «${ing.entity?.getName?.() ?? 'ингредиент'}»`);
      break;
    }
  }

  return issues;
}
