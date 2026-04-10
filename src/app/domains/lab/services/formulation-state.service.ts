import { Injectable, signal, computed, inject } from '@angular/core';
import { ICatalogIngredient, CatalogService } from './catalog.service';
import { SimulationContext } from '../../../../core/engine/simulation-context';
import { ChemicalEngine, SimulationResult } from '../../../../core/engine/chemical-engine';
import { RawIngredientInput } from '../../../../core/engine/types';
import { FormulationSolver } from '../../../../core/solvers/formulation-solver';
import { FormulationEntity } from '../../../../core/entities/formulation-entity';

export interface FormulationItem {
  id: string;
  ingredient: ICatalogIngredient;
  massGrams: number;
}

@Injectable({
  providedIn: 'root'
})
export class FormulationStateService {
  private catalogService = inject(CatalogService);

  // --- Writable State ---
  public readonly items = signal<FormulationItem[]>([]);
  public readonly targetTemperature = signal<number>(25);
  
  // Process Parameters
  public readonly mixerRpm = signal<number>(3000); // Обороты гомогенизатора
  public readonly mixingTimeMinutes = signal<number>(10); // Время смешивания

  // --- Computed Properties ---
  
  public readonly totalMass = computed(() => {
    return this.items().reduce((sum, item) => sum + item.massGrams, 0);
  });

  public readonly totalCostPerKg = computed(() => {
    const totalMass = this.totalMass();
    if (totalMass === 0) return 0;
    
    const totalCost = this.items().reduce((sum, item) => {
      return sum + (item.massGrams / 1000) * item.ingredient.pricePerKg;
    }, 0);
    
    return (totalCost / (totalMass / 1000));
  });

  // --- Core Engine Execution ---
  
  private readonly simulationResult = computed<SimulationResult | null>(() => {
    const currentItems = this.items();
    if (currentItems.length === 0) return null;

    const rawInputs: RawIngredientInput[] = currentItems.map(item => ({
      entity: item.ingredient.entity,
      massGrams: item.massGrams,
      category: item.ingredient.category
    }));

    const context = new SimulationContext(
      this.targetTemperature(),
      1, // Pressure
      this.mixerRpm(),
      this.mixingTimeMinutes()
    );

    return ChemicalEngine.runSimulation(rawInputs, context);
  });

  // --- Expose Results to UI ---

  public readonly system = computed(() => this.simulationResult()?.system || null);
  
  public readonly viscosity = computed(() => this.simulationResult()?.metrics.viscosity || 0);
  public readonly stabilityDays = computed(() => this.simulationResult()?.metrics.stabilityDays || 0);
  public readonly emulsionType = computed(() => this.simulationResult()?.system.getEmulsionType() || 'Unknown');
  public readonly enthalpy = computed(() => this.simulationResult()?.metrics.enthalpy || 0);
  public readonly actualHLB = computed(() => this.simulationResult()?.metrics.actualHLB || 0);
  public readonly hld = computed(() => this.simulationResult()?.metrics.hld || 0);
  public readonly miscibilityReport = computed(() => this.simulationResult()?.metrics.miscibility || null);
  public readonly ionicStrength = computed(() => this.simulationResult()?.metrics.ionicStrength || 0);
  public readonly ph = computed(() => this.simulationResult()?.metrics.ph || 7.0);
  public readonly solubilityIssues = computed(() => this.simulationResult()?.metrics.solubilityIssues || []);
  
  public readonly safetyIssues = computed(() => this.simulationResult()?.safety.issues || []);
  public readonly isSafe = computed(() => this.simulationResult()?.safety.isSafe ?? true);

  // --- Legacy UI Helpers ---

  public readonly requiredHLB = computed(() => {
    const sys = this.system();
    if (!sys) return 0;
    return FormulationSolver.calculateRequiredHLB(sys);
  });

  public readonly hlbMismatch = computed(() => {
    const sys = this.system();
    if (!sys) return 0;
    return FormulationSolver.calculateHLBMismatch(sys);
  });

  // --- Actions ---

  addIngredient(ingredient: ICatalogIngredient, massGrams = 10) {
    this.items.update(items => {
      const existing = items.find(i => i.ingredient.id === ingredient.id);
      if (existing) {
        return items.map(i => i.ingredient.id === ingredient.id 
          ? { ...i, massGrams: i.massGrams + massGrams } 
          : i);
      }
      return [...items, { id: Math.random().toString(36).substr(2, 9), ingredient, massGrams }];
    });
  }

  updateMass(itemId: string, massGrams: number) {
    this.items.update(items => 
      items.map(i => i.id === itemId ? { ...i, massGrams } : i)
    );
  }

  removeIngredient(itemId: string) {
    this.items.update(items => items.filter(i => i.id !== itemId));
  }

  setTemperature(temp: number) {
    this.targetTemperature.set(temp);
  }

  saveAsPremix(name: string) {
    const currentSystem = this.system();
    if (!currentSystem || this.items().length === 0) return;

    const recipe: RawIngredientInput[] = this.items().map(item => ({
      entity: item.ingredient.entity,
      massGrams: item.massGrams,
      category: item.ingredient.category
    }));

    const entity = new FormulationEntity(name, recipe, currentSystem);
    
    const newIngredient: ICatalogIngredient = {
      id: `premix_${Date.now()}`,
      name: name,
      inci: `Premix: ${name}`,
      category: 'surfactant', // Условно
      segments: ['cosmetics', 'household', 'coatings', 'agro'],
      pricePerKg: this.totalCostPerKg(),
      description: `Пользовательский премикс. Содержит ${this.items().length} компонентов.`,
      entity: entity
    };

    this.catalogService.addIngredient(newIngredient);
  }
}
