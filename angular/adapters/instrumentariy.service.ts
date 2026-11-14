import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/** Конфигурация подключения к instrumentariy gateway. */
export interface GatewayConfig {
  baseUrl: string;
  timeoutMs: number;
}

/** Результат вызова инструмента. */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Статус соединения с gateway. */
export type GatewayStatus = 'unknown' | 'connected' | 'disconnected' | 'error';

/**
 * Сервис для взаимодействия с instrumentariy REST gateway.
 * Gateway предоставляет доступ к инструментам рассуждений (reasoning-*, think, etc.).
 */
@Injectable({ providedIn: 'root' })
export class InstrumentariyService {
  private readonly DEFAULT_CONFIG: GatewayConfig = {
    baseUrl: 'http://localhost:3030',
    timeoutMs: 10000
  };

  private http = inject(HttpClient);
  private config = signal<GatewayConfig>(this.DEFAULT_CONFIG);
  readonly status = signal<GatewayStatus>('unknown');
  readonly lastError = signal<string | null>(null);

  /** Обновить конфигурацию gateway. */
  setConfig(config: Partial<GatewayConfig>) {
    this.config.update(c => ({ ...c, ...config }));
  }

  /** Проверить доступность gateway. */
  async ping(): Promise<boolean> {
    try {
      const url = `${this.config().baseUrl}/list`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config().timeoutMs);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      this.status.set(response.ok ? 'connected' : 'error');
      this.lastError.set(null);
      return response.ok;
    } catch (e) {
      this.status.set('disconnected');
      this.lastError.set(e instanceof Error ? e.message : 'Connection failed');
      return false;
    }
  }

  /** Получить список доступных инструментов. */
  async listTools(): Promise<{ name: string; description: string; category: string }[]> {
    try {
      const url = `${this.config().baseUrl}/list`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (e) {
      this.status.set('disconnected');
      this.lastError.set(e instanceof Error ? e.message : 'List failed');
      return [];
    }
  }

  /** Выполнить инструмент по имени. */
  async runTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
    try {
      const url = `${this.config().baseUrl}/run/${encodeURIComponent(name)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      const result = await response.json();
      return result;
    } catch (e) {
      this.status.set('disconnected');
      this.lastError.set(e instanceof Error ? e.message : 'Run failed');
      return { success: false, error: this.lastError() || 'Unknown error' };
    }
  }

  /** Выполнить пайплайн инструментов. */
  async runPipeline(steps: { tool: string; args?: Record<string, unknown> }[]): Promise<ToolResult> {
    try {
      const url = `${this.config().baseUrl}/pipeline`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      const result = await response.json();
      return result;
    } catch (e) {
      this.status.set('disconnected');
      this.lastError.set(e instanceof Error ? e.message : 'Pipeline failed');
      return { success: false, error: this.lastError() || 'Unknown error' };
    }
  }

  /** Reasoning: оценить сложность задачи. */
  async reasonComplexity(task: string): Promise<ToolResult> {
    return this.runTool('reasoning-complexity', { task });
  }

  /** Reasoning: оценить покрытие пространства вариантов. */
  async reasonCoverage(space: string): Promise<ToolResult> {
    return this.runTool('reasoning-coverage', { space });
  }

  /** Reasoning: оценить достаточность. */
  async reasonSufficiency(space: string, solution: string): Promise<ToolResult> {
    return this.runTool('reasoning-sufficiency', { space, solution });
  }

  /** Reasoning: полный цикл. */
  async reasonFull(task: string): Promise<ToolResult> {
    return this.runTool('reasoning-full', { task });
  }

  /** Think: минимальное рассуждение L0. */
  async think(text: string): Promise<ToolResult> {
    return this.runTool('think', { text });
  }
}
