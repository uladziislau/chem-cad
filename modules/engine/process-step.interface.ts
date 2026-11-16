import { RawIngredientInput } from './types';

export type OperationType = 'ADD' | 'MIX' | 'HEAT' | 'COOL' | 'EMULSIFY' | 'HOLD';

const OPERATIONS: readonly OperationType[] = ['ADD', 'MIX', 'HEAT', 'COOL', 'EMULSIFY', 'HOLD'];

/** Типобезопасная проверка значения из внешних данных (localStorage, API). */
export function isOperationType(value: unknown): value is OperationType {
  return typeof value === 'string' && (OPERATIONS as readonly string[]).includes(value);
}

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

  const checks: (() => string | null)[] = [
    () => (!step.id || !step.id.trim()) ? 'Идентификатор этапа не может быть пустым' : null,
    () => (!isOperationType(step.operation)) ? `Неизвестный тип операции «${String(step.operation)}»` : null,
    () => (!step.name || !step.name.trim()) ? 'Название этапа не может быть пустым' : null,
    () => (!Number.isFinite(step.durationMinutes) || step.durationMinutes <= 0) ? 'Длительность должна быть положительным числом минут' : null,
    () => (step.targetTemperature !== undefined && !Number.isFinite(step.targetTemperature)) ? 'Целевая температура должна быть числом' : null,
    () => (step.rpm !== undefined && (!Number.isFinite(step.rpm) || step.rpm < 0)) ? 'Скорость вращения должна быть неотрицательным числом' : null,
  ];

  for (const check of checks) {
    const issue = check();
    if (issue) issues.push(issue);
  }

  const firstBad = (step.ingredients ?? []).find(i =>
    !i.entity || typeof i.entity.getName !== 'function' ||
    !Number.isFinite(i.massGrams) || i.massGrams <= 0
  );
  if (firstBad) {
    issues.push(`Некорректный компонент «${firstBad.entity?.getName?.() ?? 'ингредиент'}» на этапе`);
  }

  return issues;
}
