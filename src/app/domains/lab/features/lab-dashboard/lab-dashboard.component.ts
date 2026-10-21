import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { FormulationStateService } from '../../services/formulation-state.service';
import { AutarkyService } from '../../../shared/services/autarky.service';
import { MicroscopeViewComponent } from './microscope-view.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MicroscopeViewComponent, RouterLink],
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
  Math = Math;

  filteredIngredients = computed(() => {
    const segment = this.autarky.selectedSegment();
    const all = this.catalog.getAllIngredients();
    if (!segment) return all;
    return all.filter(ing => ing.segments.includes(segment));
  });

  savePremix() {
    const name = prompt('Введите название премикса (базы):', 'Новая база');
    if (name) {
      this.state.saveAsPremix(name);
    }
  }
}
