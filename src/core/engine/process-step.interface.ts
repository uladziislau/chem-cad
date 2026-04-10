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
