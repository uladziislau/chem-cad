import { Injectable, signal } from '@angular/core';

/**
 * Точка инициализации приложения (эталон §10).
 *
 * Здесь будет предзагрузка данных доменов при старте (APP_INITIALIZER в
 * app.config.ts). Сейчас доменные сервисы читают данные лениво — initialize()
 * фиксирует готовность bootstrap без блокирующей работы.
 */
@Injectable({ providedIn: 'root' })
export class AppInitializerService {
  readonly isReady = signal(false);

  async initialize(): Promise<void> {
    this.isReady.set(true);
  }
}
