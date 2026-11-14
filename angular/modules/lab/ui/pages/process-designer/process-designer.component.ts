import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ProcessStateService } from '@modules/lab/services/process-state.service';
import { CatalogService, ICatalogIngredient } from '@modules/lab/services/catalog.service';
import { RouterLink } from '@angular/router';
import { MicroscopeViewComponent } from '@modules/lab/ui/pages/lab-dashboard/microscope-view.component';
import { formatReportText, formatReportCsv, downloadText } from '@adapters/report.service';
import { OperationType } from '@root-modules/engine/process-step.interface';

@Component({
  selector: 'app-process-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MicroscopeViewComponent, DragDropModule],
  templateUrl: './process-designer.component.html',
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
    .cdk-drag-preview { box-shadow: 0 10px 30px rgba(0,0,0,.5); border-radius: 12px; }
    .cdk-drag-placeholder { opacity: .3; }
    .cdk-drag-animating { transition: transform .2s ease; }
  `]
})
export class ProcessDesignerComponent {
  process = inject(ProcessStateService);
  catalog = inject(CatalogService);
  Math = Math;
  Number = Number;

  showCatalog = false;

  activeStep = computed(() => {
    const steps = this.process.currentProcess().steps;
    const index = this.process.activeStepIndex();
    return steps[index] || null;
  });

  addStep(op: OperationType) {
    this.process.addStep(op);
  }

  dropStep(event: CdkDragDrop<unknown[]>) {
    this.process.reorderSteps(event.previousIndex, event.currentIndex);
  }

  addIngredientToStep(stepId: string, ingredient: ICatalogIngredient) {
    this.process.addIngredientsToStep(stepId, [{
      entity: ingredient.entity,
      massGrams: 10,
      category: ingredient.category
    }]);
    this.showCatalog = false;
  }

  updateIngredientMass(stepId: string, index: number, mass: number) {
    const step = this.process.currentProcess().steps.find((s: { id: string }) => s.id === stepId);
    if (step && step.ingredients) {
      const newIngredients = [...step.ingredients];
      newIngredients[index] = { ...newIngredients[index], massGrams: mass };
      this.process.updateStep(stepId, { ingredients: newIngredients });
    }
  }

  exportReport(format: 'txt' | 'csv') {
    const result = this.process.currentStepResult();
    if (!result) return;
    const stepName = this.activeStep()?.name || 'step';
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    if (format === 'txt') {
      downloadText(`chem-report-${stepName}-${stamp}.txt`, formatReportText(result));
    } else {
      downloadText(`chem-report-${stepName}-${stamp}.csv`, formatReportCsv(result), 'text/csv');
    }
  }
}
