import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { Ingredient } from '@root-modules/formulation/models/ingredient.model';
import { downloadJson } from '../../../../download-json';

type IngredientType = Ingredient['type'];

const TYPE_OPTIONS: { value: IngredientType; label: string }[] = [
  { value: 'base', label: 'Основа' },
  { value: 'surfactant', label: 'ПАВ' },
  { value: 'solvent', label: 'Растворитель' },
  { value: 'active', label: 'Активный компонент' },
  { value: 'fragrance', label: 'Отдушка / Эфирное масло' },
  { value: 'preservative', label: 'Консервант' },
  { value: 'additive', label: 'Добавка' },
];

interface Draft {
  name: string;
  type: IngredientType;
  description: string;
  safety: string;
}

const EMPTY_DRAFT: Draft = { name: '', type: 'additive', description: '', safety: '' };

@Component({
  selector: 'app-ingredient-catalog',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Каталог ингредиентов</h1>
          <p class="text-slate-600 mt-2">Встроенные компоненты и ваши собственные. Пользовательские хранятся локально.</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" (click)="exportAll()"
                  class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            Экспорт
          </button>
          <button type="button" (click)="fileInput.click()"
                  class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            Импорт
          </button>
          <input #fileInput type="file" accept=".json,application/json" class="hidden"
                 (change)="onImportFile($event)">
          <a routerLink="/formulator/formulator"
             class="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700">
            К формулятору
          </a>
        </div>
      </div>

      @if (statusMessage()) {
        <div class="p-3 rounded-xl border text-sm"
             [class.bg-emerald-50]="statusOk()"
             [class.border-emerald-200]="statusOk()"
             [class.text-emerald-800]="statusOk()"
             [class.bg-rose-50]="!statusOk()"
             [class.border-rose-200]="!statusOk()"
             [class.text-rose-800]="!statusOk()">
          {{ statusMessage() }}
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- List -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex gap-3">
            <input type="text" [ngModel]="searchText()" (ngModelChange)="searchText.set($event)" placeholder="Поиск по названию…"
                   class="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)"
                    class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
              <option value="">Все типы</option>
              @for (t of typeOptions; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            @for (ingredient of filteredIngredients(); track ingredient.id) {
              <div class="w-full p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                   role="button" tabindex="0"
                   (click)="select(ingredient)"
                   (keydown.enter)="select(ingredient)"
                   [class.bg-indigo-50]="editingId() === ingredient.id">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-medium text-slate-900 truncate">{{ ingredient.name }}</h3>
                    @if (ingredient.isCustom) {
                      <span class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold uppercase">свой</span>
                    }
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">{{ typeLabel(ingredient.type) }} · {{ ingredient.id }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button type="button" class="p-1 text-slate-400 hover:text-slate-700"
                          title="Экспорт в JSON" aria-label="Экспорт"
                          (click)="exportOne(ingredient.id); $event.stopPropagation()">
                    <span class="material-icons text-lg">download</span>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="p-10 text-center text-slate-500 text-sm">Ничего не найдено</div>
            }
          </div>
        </div>

        <!-- Editor -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-fit">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ editingId() ? 'Редактирование' : 'Новый ингредиент' }}
            </h2>
            @if (editingId()) {
              <button type="button" (click)="resetForm()" class="text-xs text-slate-500 hover:text-slate-800">Отмена</button>
            }
          </div>

          <div class="space-y-4">
            <div>
              <label for="ing-name" class="block text-xs font-bold text-slate-500 uppercase mb-1">Название</label>
              <input id="ing-name" type="text" [(ngModel)]="draft.name"
                     class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
              <label for="ing-type" class="block text-xs font-bold text-slate-500 uppercase mb-1">Тип</label>
              <select id="ing-type" [(ngModel)]="draft.type"
                      class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                @for (t of typeOptions; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </div>
            <div>
              <label for="ing-desc" class="block text-xs font-bold text-slate-500 uppercase mb-1">Описание</label>
              <textarea id="ing-desc" [(ngModel)]="draft.description" rows="3"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
            <div>
              <label for="ing-safety" class="block text-xs font-bold text-slate-500 uppercase mb-1">Безопасность</label>
              <textarea id="ing-safety" [(ngModel)]="draft.safety" rows="3"
                        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>

            @if (formError()) {
              <p class="text-sm text-rose-600">{{ formError() }}</p>
            }

            <div class="flex gap-2 pt-2">
              <button type="button" (click)="save()" [disabled]="!canSave()"
                      class="flex-1 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
                {{ editingId() ? 'Сохранить' : 'Добавить' }}
              </button>
              @if (editingId() && editingCustom()) {
                <button type="button" (click)="remove()"
                        class="px-4 py-2 bg-rose-600 rounded-lg text-sm font-medium text-white hover:bg-rose-700">
                  Удалить
                </button>
              }
            </div>

            @if (editingId() && !editingCustom()) {
              <p class="text-xs text-slate-400">Встроенный ингредиент — только просмотр. Скопируйте через «Экспорт» и импортируйте как свой для изменений.</p>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class IngredientCatalogComponent {
  private ingredientService = inject(IngredientService);

  typeOptions = TYPE_OPTIONS;
  ingredients = this.ingredientService.getIngredients();

  searchText = signal('');
  typeFilter = signal('');
  draft: Draft = { ...EMPTY_DRAFT };
  editingId = signal<string | null>(null);
  editingCustom = signal(false);
  formError = signal<string | null>(null);
  statusMessage = signal<string | null>(null);
  statusOk = signal(true);

  filteredIngredients = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const t = this.typeFilter();
    return this.ingredients().filter(i =>
      (!q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
      && (!t || i.type === t));
  });

  canSave(): boolean {
    return this.draft.name.trim().length > 0;
  }

  typeLabel(type: string): string {
    return TYPE_OPTIONS.find(t => t.value === type)?.label ?? type;
  }

  select(ingredient: Ingredient): void {
    this.editingId.set(ingredient.id);
    this.editingCustom.set(ingredient.isCustom === true);
    this.formError.set(null);
    this.draft = {
      name: ingredient.name,
      type: ingredient.type,
      description: ingredient.description,
      safety: ingredient.safety,
    };
  }

  resetForm(): void {
    this.editingId.set(null);
    this.editingCustom.set(false);
    this.draft = { ...EMPTY_DRAFT };
    this.formError.set(null);
  }

  save(): void {
    if (!this.canSave()) {
      this.formError.set('Название обязательно');
      return;
    }
    const id = this.editingId();
    if (id) {
      const updated = this.ingredientService.updateIngredient(id, { ...this.draft });
      if (!updated) {
        this.formError.set('Встроенный ингредиент нельзя редактировать');
        return;
      }
      this.flash('Ингредиент обновлён', true);
    } else {
      this.ingredientService.addIngredient({ ...this.draft });
      this.flash('Ингредиент добавлен', true);
    }
    this.resetForm();
  }

  remove(): void {
    const id = this.editingId();
    if (!id) return;
    if (this.ingredientService.removeIngredient(id)) {
      this.flash('Ингредиент удалён', true);
      this.resetForm();
    } else {
      this.formError.set('Удалить можно только свой ингредиент');
    }
  }

  exportAll(): void {
    downloadJson(this.ingredientService.exportIngredients(), 'ingredients.json');
    this.flash('Экспортировано', true);
  }

  exportOne(id: string): void {
    const json = this.ingredientService.exportIngredient(id);
    if (json) {
      downloadJson(json, `ingredient-${id}.json`);
      this.flash('Экспортировано', true);
    }
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    file.text().then(text => {
      const count = this.ingredientService.importIngredients(text);
      this.flash(count > 0 ? `Импортировано ингредиентов: ${count}` : 'Импорт: нет валидных записей', count > 0);
    });
  }

  private flash(message: string, ok: boolean): void {
    this.statusMessage.set(message);
    this.statusOk.set(ok);
  }
}
