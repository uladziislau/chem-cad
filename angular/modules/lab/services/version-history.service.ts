import { Injectable, inject } from '@angular/core';
import { ICatalogIngredient, CatalogService } from './catalog.service';

/** Снимок рецептуры на момент сохранения. */
export interface FormulationSnapshot {
  id: string;
  name: string;
  createdAt: string; // ISO
  temperatureC: number;
  mixerRpm: number;
  mixingTimeMin: number;
  totalMassG: number;
  items: { ingredientId: string; massGrams: number }[];
}

/** Запись истории версий. */
export interface FormulationVersion extends FormulationSnapshot {
  version: number;
  parentId?: string; // id предыдущей версии
}

/** Хранилище версий рецептур в localStorage. */
@Injectable({ providedIn: 'root' })
export class VersionHistoryService {
  private readonly STORAGE_KEY = 'chem-cad.formulation-versions';
  private catalog = inject(CatalogService);

  /** Все сохранённые версии (новые первыми). */
  listVersions(): FormulationVersion[] {
    return this.readAll().sort((a, b) => b.version - a.version);
  }

  /** Сохранить текущую рецептуру как новую версию. */
  saveVersion(name: string, snapshot: Omit<FormulationSnapshot, 'id' | 'createdAt' | 'name'>): FormulationVersion {
    const all = this.readAll();
    const parent = all.length > 0 ? all[all.length - 1] : undefined;
    const version: FormulationVersion = {
      ...snapshot,
      id: crypto.randomUUID(),
      name,
      version: all.length + 1,
      parentId: parent?.id,
      createdAt: new Date().toISOString()
    };
    all.push(version);
    this.writeAll(all);
    return version;
  }

  /** Восстановить снимок в массив ингредиентов каталога. */
  restoreItems(versionId: string): { ingredient: ICatalogIngredient; massGrams: number }[] {
    const v = this.readAll().find(x => x.id === versionId);
    if (!v) return [];
    return v.items
      .map(item => {
        const ingredient = this.catalog.getIngredientById(item.ingredientId);
        return ingredient ? { ingredient, massGrams: item.massGrams } : null;
      })
      .filter((x): x is { ingredient: ICatalogIngredient; massGrams: number } => x !== null);
  }

  /** Удалить версию. */
  deleteVersion(id: string): void {
    this.writeAll(this.readAll().filter(v => v.id !== id));
  }

  /** Сравнить две версии: вернуть различия по ингредиентам. */
  diffVersions(idA: string, idB: string): { ingredientId: string; name: string; massA: number; massB: number; delta: number }[] {
    const a = this.readAll().find(v => v.id === idA);
    const b = this.readAll().find(v => v.id === idB);
    if (!a || !b) return [];
    const mapA = new Map(a.items.map(i => [i.ingredientId, i.massGrams]));
    const mapB = new Map(b.items.map(i => [i.ingredientId, i.massGrams]));
    const ids = new Set([...mapA.keys(), ...mapB.keys()]);
    const result: { ingredientId: string; name: string; massA: number; massB: number; delta: number }[] = [];
    for (const id of ids) {
      const massA = mapA.get(id) ?? 0;
      const massB = mapB.get(id) ?? 0;
      if (massA !== massB) {
        const ing = this.catalog.getIngredientById(id);
        result.push({
          ingredientId: id,
          name: ing?.name ?? id,
          massA,
          massB,
          delta: massB - massA
        });
      }
    }
    return result.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  }

  private readAll(): FormulationVersion[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeAll(versions: FormulationVersion[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
  }
}
