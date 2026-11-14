import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Типы событий, курсирующих в распределенной системе.
 */
export enum SystemEventType {
  SMILES_GENERATED = 'SMILES_GENERATED',       // AI или Пользователь придумал молекулу
  MOLECULE_PARSED = 'MOLECULE_PARSED',         // Топологический узел построил граф
  THERMO_ANALYSIS_DONE = 'THERMO_ANALYSIS_DONE', // Термодинамический узел посчитал энергию
  MD_SIMULATION_TICK = 'MD_SIMULATION_TICK',   // Тик физического движка
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

/**
 * Базовый интерфейс сообщения в шине.
 */
export interface SystemEvent<T = unknown> {
  type: SystemEventType;
  payload: T;
  timestamp: number;
  sourceNode: string; // Какой узел сгенерировал событие
}

/**
 * Центральная нервная система нашего движка.
 * Реализует паттерн Publisher-Subscriber (Event Bus).
 * Позволяет независимым узлам (Квантовому, МД, Термодинамическому) общаться асинхронно,
 * не зная друг о друге напрямую. В будущем это позволит легко вынести узлы в WebWorkers.
 */
@Injectable({
  providedIn: 'root'
})
export class ChemEventBusService {
  private bus$ = new Subject<SystemEvent<unknown>>();

  /**
   * Опубликовать событие в систему.
   */
  dispatch<T>(type: SystemEventType, payload: T, sourceNode = 'Unknown'): void {
    const event: SystemEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      sourceNode
    };
    
    // В реальной production-системе здесь можно добавить логирование всех событий
    // console.debug(`[EventBus] ${type} from ${sourceNode}`, payload);
    
    this.bus$.next(event);
  }

  /**
   * Подписаться на определенный тип событий.
   */
  on<T>(type: SystemEventType): Observable<SystemEvent<T>> {
    return this.bus$.asObservable().pipe(
      filter(event => event.type === type)
    ) as Observable<SystemEvent<T>>;
  }
}
