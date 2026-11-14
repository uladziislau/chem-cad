import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '@modules/lab/services/catalog.service';
import { FormulationStateService } from '@modules/lab/services/formulation-state.service';
import { AutarkyService } from '@adapters/autarky.service';
import { MicroscopeViewComponent } from './microscope-view.component';
import { TargetSpecsComponent } from './target-specs.component';
import { SafetyBannerComponent } from './safety-banner.component';
import { VersionHistoryComponent } from './version-history.component';
import { ReasoningPanelComponent } from './reasoning-panel.component';
import { DetergencyPanelComponent } from './detergency-panel.component';
import { DryingPanelComponent } from './drying-panel.component';
import { FormulationOptimizerComponent } from './formulation-optimizer.component';
import { Router, RouterLink } from '@angular/router';
import { RecipeService } from '@modules/recipe/services/recipe.service';
import { IngredientService } from '@modules/formulation/services/ingredient.service';
import { formulationToRecipe, labItemsToFormulationExport } from '@root-modules/recipe/formulation-export';

import { formatReportText, formatReportCsv, downloadText } from '@adapters/report.service';
import { FormulationReportService } from '@modules/lab/services/formulation-report.service';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MicroscopeViewComponent, TargetSpecsComponent, VersionHistoryComponent, SafetyBannerComponent, ReasoningPanelComponent, DetergencyPanelComponent, DryingPanelComponent, FormulationOptimizerComponent, RouterLink],
  templateUrl: './lab-dashboard.component.html',
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  `]
})
export class LabDashboardComponent {
  catalog = inject(CatalogService);
  state = inject(FormulationStateService);
  autarky = inject(AutarkyService);
  private reportService = inject(FormulationReportService);
  private recipeService = inject(RecipeService);
  private ingredientService = inject(IngredientService);
  private router = inject(Router);
  Math = Math;

  searchQuery = signal('');
  categoryFilter = signal<string>('all');

  filteredIngredients = computed(() => {
    const segment = this.autarky.selectedSegment();
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.categoryFilter();
    let all = this.catalog.getAllIngredients();
    if (segment) {
      all = all.filter(ing => ing.segments.includes(segment));
    }
    if (cat !== 'all') {
      all = all.filter(ing => ing.category === cat);
    }
    if (query) {
      all = all.filter(ing =>
        ing.name.toLowerCase().includes(query) ||
        ing.inci.toLowerCase().includes(query)
      );
    }
    return all;
  });

  savePremix() {
    const name = prompt('Введите название премикса (базы):', 'Новая база');
    if (name) {
      this.state.saveAsPremix(name);
    }
  }

  /** Сохраняет текущую lab-рецептуру (массы) как Recipe в каталоге рецептов. */
  saveAsRecipe() {
    const items = this.state.items();
    if (items.length === 0) return;
    const name = prompt('Название рецепта:', 'Моя рецептура');
    if (!name) return;
    const rawCategory = prompt('Категория (hygiene / perfume / cleaning):', 'hygiene') || 'hygiene';
    const validCategory: 'hygiene' | 'perfume' | 'cleaning' =
      rawCategory === 'perfume' || rawCategory === 'cleaning' ? rawCategory : 'hygiene';

    const catalog = this.ingredientService.getIngredients()();
    const { items: exportItems, skipped } = labItemsToFormulationExport(items, catalog);
    if (exportItems.length === 0) {
      alert('Ни один ингредиент не найден в каталоге рецептур — сохранить нельзя.');
      return;
    }
    const draft = formulationToRecipe(exportItems, { name, category: validCategory });
    const recipe = this.recipeService.addRecipe(draft);
    if (skipped.length > 0) {
      alert(`Рецепт сохранён. Пропущены ингредиенты без соответствия в каталоге: ${skipped.join(', ')}`);
    }
    this.router.navigate(['/recipes', 'detail', recipe.id]);
  }

  exportReport(format: 'txt' | 'csv') {
    const result = this.state.report();
    if (!result) return;

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    if (format === 'txt') {
      downloadText(`chem-report-${stamp}.txt`, formatReportText(result));
    } else {
      downloadText(`chem-report-${stamp}.csv`, formatReportCsv(result), 'text/csv');
    }
  }

  /** Открыть печатный отчёт (HTML → PDF через браузер). */
  printReport() {
    this.reportService.printReport();
  }
}
