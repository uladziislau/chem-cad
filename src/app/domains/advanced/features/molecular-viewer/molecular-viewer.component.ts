import { Component, ElementRef, OnInit, ViewChild, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import SmilesDrawer from 'smiles-drawer';
import * as $3Dmol from '3dmol';

interface ChemProperties {
  MolecularWeight?: string;
  XLogP?: string;
  TPSA?: string;
  ExactMass?: string;
  Complexity?: string;
}

@Component({
  selector: 'app-molecular-viewer',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Молекулярный визуализатор</h1>
        <p class="text-slate-600 mt-2">Симбиоз библиотек SmilesDrawer (2D) и 3Dmol.js (3D) с интеграцией PubChem.</p>
      </div>

      <!-- Control Panel -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-grow w-full">
            <label for="smiles-input" class="block text-sm font-medium text-slate-700 mb-1">SMILES нотация</label>
            <input id="smiles-input" type="text" [(ngModel)]="smiles" (keyup.enter)="visualize()"
                   class="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                   placeholder="Введите SMILES (например, CC(=O)Oc1ccccc1C(=O)O)">
          </div>
          <button (click)="visualize()" 
                  class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
            <mat-icon>science</mat-icon>
            Анализировать
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <span class="text-sm text-slate-500 py-1">Примеры:</span>
          @for (example of examples; track example.name) {
            <button (click)="loadExample(example.smiles)" 
                    class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-sm transition-colors border border-slate-200">
              {{ example.name }}
            </button>
          }
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <mat-icon class="animate-spin text-indigo-600 text-4xl w-10 h-10">autorenew</mat-icon>
        </div>
      }

      @if (error()) {
        <div class="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-start gap-3">
          <mat-icon class="mt-0.5">error_outline</mat-icon>
          <p>{{ error() }}</p>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" [class.hidden]="isLoading() || error()">
        
        <!-- 2D Viewer (SmilesDrawer) -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <h2 class="text-lg font-semibold text-slate-900 mb-4 w-full flex items-center">
            <mat-icon class="mr-2 text-indigo-600">architecture</mat-icon>
            2D Структура (SmilesDrawer)
          </h2>
          <div class="w-full aspect-square bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
            <canvas #smilesCanvas id="smiles-canvas" width="400" height="400" class="max-w-full max-h-full"></canvas>
          </div>
        </div>

        <!-- 3D Viewer (3Dmol.js) -->
        <div class="bg-slate-900 rounded-2xl shadow-inner border border-slate-800 p-6 flex flex-col">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
            <mat-icon class="mr-2 text-indigo-400">3d_rotation</mat-icon>
            3D Модель (3Dmol.js)
          </h2>
          <div class="w-full aspect-square bg-black rounded-xl border border-slate-700 overflow-hidden relative">
            <div #viewer3d class="absolute inset-0"></div>
          </div>
          <div class="mt-4 flex justify-center gap-2">
            <button (click)="set3DStyle('stick')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors border border-slate-600">Стержни</button>
            <button (click)="set3DStyle('sphere')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors border border-slate-600">Сферы</button>
            <button (click)="set3DStyle('cross')" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors border border-slate-600">Кресты</button>
          </div>
        </div>

        <!-- Properties (PubChem API) -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <mat-icon class="mr-2 text-indigo-600">analytics</mat-icon>
            Свойства (PubChem)
          </h2>
          
          <div class="flex-grow space-y-4">
            @if (properties()) {
              <div class="grid grid-cols-1 gap-3">
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span class="text-sm text-slate-500">Молярная масса</span>
                  <span class="font-mono font-bold text-slate-900">{{ properties()?.MolecularWeight || 'N/A' }} <span class="text-xs text-slate-400 font-normal">г/моль</span></span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span class="text-sm text-slate-500">Точная масса</span>
                  <span class="font-mono font-bold text-slate-900">{{ properties()?.ExactMass || 'N/A' }}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span class="text-sm text-slate-500">XLogP (Липофильность)</span>
                  <span class="font-mono font-bold text-slate-900">{{ properties()?.XLogP || 'N/A' }}</span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span class="text-sm text-slate-500">TPSA (Полярная площадь)</span>
                  <span class="font-mono font-bold text-slate-900">{{ properties()?.TPSA || 'N/A' }} <span class="text-xs text-slate-400 font-normal">Å²</span></span>
                </div>
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span class="text-sm text-slate-500">Сложность</span>
                  <span class="font-mono font-bold text-slate-900">{{ properties()?.Complexity || 'N/A' }}</span>
                </div>
              </div>
            } @else {
              <div class="h-full flex items-center justify-center text-slate-400 text-sm text-center">
                Свойства будут загружены после анализа структуры.
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class MolecularViewerComponent implements OnInit {
  @ViewChild('smilesCanvas') smilesCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewer3d') viewer3dRef!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  smiles = 'CC(=O)Oc1ccccc1C(=O)O'; // Aspirin default
  isLoading = signal(false);
  error = signal<string | null>(null);
  properties = signal<ChemProperties | null>(null);

  examples = [
    { name: 'Аспирин', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
    { name: 'Кофеин', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' },
    { name: 'Парацетамол', smiles: 'CC(=O)Nc1ccc(O)cc1' },
    { name: 'Пенициллин G', smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)CC3=CC=CC=C3)C(=O)O)C' },
    { name: 'Дофамин', smiles: 'C1=CC(=C(C=C1CCN)O)O' }
  ];

  private viewer: unknown;
  private drawer: unknown;

  ngOnInit() {
    if (this.isBrowser) {
      // Initialize SmilesDrawer
      this.drawer = new SmilesDrawer.Drawer({
        width: 400,
        height: 400,
        padding: 10,
        compactDrawing: false
      });
      
      // Initial visualization needs a slight delay to ensure view is ready
      setTimeout(() => this.visualize(), 100);
    }
  }

  loadExample(smiles: string) {
    this.smiles = smiles;
    this.visualize();
  }

  async visualize() {
    if (!this.isBrowser || !this.smiles.trim()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.properties.set(null);

    try {
      // 1. Draw 2D
      this.draw2D();

      // 2. Fetch 3D SDF and Properties from PubChem
      await this.fetchPubChemData();

    } catch (err: unknown) {
      this.error.set(err instanceof Error ? err.message : 'Произошла ошибка при анализе структуры.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private draw2D() {
    try {
      SmilesDrawer.parse(this.smiles, (tree: unknown) => {
        (this.drawer as unknown as { draw: (t: unknown, id: string, theme: string, b: boolean) => void }).draw(tree, 'smiles-canvas', 'light', false);
      }, (err: unknown) => {
        console.error('SmilesDrawer parse error:', err);
        throw new Error('Некорректный SMILES для 2D отрисовки.');
      });
    } catch (e) {
      console.error(e);
      throw new Error('Ошибка при генерации 2D структуры.');
    }
  }

  private async fetchPubChemData() {
    const encodedSmiles = encodeURIComponent(this.smiles);
    
    // Fetch Properties
    try {
      const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/property/MolecularWeight,XLogP,TPSA,ExactMass,Complexity/JSON`;
      const propRes = await fetch(propUrl);
      if (!propRes.ok) throw new Error('Свойства не найдены в PubChem.');
      const propData = await propRes.json();
      if (propData.PropertyTable?.Properties?.length > 0) {
        this.properties.set(propData.PropertyTable.Properties[0]);
      }
    } catch (e) {
      console.warn('Could not fetch properties', e);
      // Don't fail completely if just properties fail
    }

    // Fetch 3D SDF
    try {
      // Note: We request 3D coordinates specifically if available, otherwise 2D SDF which 3Dmol can still render
      const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF?record_type=3d`;
      let sdfRes = await fetch(sdfUrl);
      
      if (!sdfRes.ok) {
        // Fallback to 2D SDF if 3D is not available
        const sdf2dUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/SDF`;
        sdfRes = await fetch(sdf2dUrl);
      }

      if (!sdfRes.ok) throw new Error('Не удалось получить 3D модель из PubChem.');
      
      const sdfText = await sdfRes.text();
      this.render3D(sdfText);
    } catch (e: unknown) {
      console.error(e);
      throw new Error(e instanceof Error ? e.message : 'Ошибка загрузки 3D модели.');
    }
  }

  private render3D(sdfData: string) {
    if (!this.viewer) {
      const element = this.viewer3dRef.nativeElement;
      this.viewer = $3Dmol.createViewer(element, { backgroundColor: 'black' });
    }

    const v = this.viewer as unknown as { 
      clear: () => void; 
      addModel: (d: string, f: string) => void; 
      setStyle: (s1: unknown, s2: unknown) => void; 
      zoomTo: () => void; 
      render: () => void; 
    };
    v.clear();
    v.addModel(sdfData, 'sdf');
    v.setStyle({}, { stick: {} });
    v.zoomTo();
    v.render();
  }

  set3DStyle(style: 'stick' | 'sphere' | 'cross') {
    if (!this.viewer) return;
    
    const v = this.viewer as unknown as { 
      setStyle: (s1: unknown, s2: unknown) => void; 
      render: () => void; 
    };
    v.setStyle({}, { [style]: {} });
    v.render();
  }
}
