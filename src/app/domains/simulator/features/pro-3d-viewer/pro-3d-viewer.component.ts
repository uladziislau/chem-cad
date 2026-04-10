import { Component, ElementRef, ViewChild, AfterViewInit, Input, signal, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-pro-3d-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full relative bg-slate-950">
      <div #viewerContainer class="w-full h-full absolute inset-0 outline-none"></div>
      
      <!-- Loading Overlay -->
      @if (loading()) {
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 transition-opacity duration-300">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <span class="text-xs font-mono text-indigo-400 animate-pulse">Запрос 3D конформера из PubChem...</span>
        </div>
      }
      
      <!-- Error Overlay -->
      @if (error(); as err) {
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-10">
          <div class="text-rose-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span class="text-sm font-bold text-rose-400">{{ err === '3D Structure not found' ? '3D структура не найдена' : 'Ошибка загрузки' }}</span>
          <span class="text-xs text-slate-500 mt-2 max-w-xs text-center">В базе PubChem может отсутствовать 3D модель для данного SMILES кода.</span>
        </div>
      }
      
      <!-- Controls Overlay -->
      <div class="absolute top-4 right-4 z-10 flex gap-2">
        <button (click)="setStyle('stick')" class="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors backdrop-blur">Стержни</button>
        <button (click)="setStyle('sphere')" class="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors backdrop-blur">Сферы</button>
        <button (click)="setStyle('surface')" class="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors backdrop-blur">Поверхность</button>
      </div>
    </div>
  `
})
export class Pro3DViewerComponent implements AfterViewInit {
  @ViewChild('viewerContainer') container!: ElementRef;
  
  @Input() set smiles(val: string) {
    if (val && this.isBrowser) {
      this.loadSmiles(val);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewer: any;
  loading = signal(false);
  error = signal<string | null>(null);
  currentStyle = 'stick';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private $3Dmol: any;

  async ngAfterViewInit() {
    if (!this.isBrowser) return;
    
    try {
      // Dynamic import to avoid SSR errors with libraries that access 'window'
      const mod = await import('3dmol');
      this.$3Dmol = mod;
      
      // Initialize 3Dmol viewer
      this.viewer = this.$3Dmol.createViewer(this.container.nativeElement, {
        backgroundColor: '#020617', // slate-950
        antialias: true
      });
    } catch (err) {
      console.error('Failed to load 3Dmol library:', err);
      this.error.set('Failed to initialize 3D viewer');
    }
  }

  async loadSmiles(smiles: string) {
    if (!this.viewer) {
      // If viewer is not ready yet, wait a bit and retry
      if (this.isBrowser) {
        setTimeout(() => this.loadSmiles(smiles), 500);
      }
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // Use PubChem PUG REST API to get 3D SDF
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF?record_type=3d`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('3D Structure not found');
      }
      
      const sdfData = await response.text();
      
      this.viewer.clear();
      this.viewer.addModel(sdfData, "sdf");
      this.applyCurrentStyle();
      this.viewer.zoomTo();
      this.viewer.render();
      
    } catch (e: unknown) {
      const error = e as Error;
      console.error('PubChem Error:', error);
      this.error.set(error.message || 'Failed to load 3D structure');
      this.viewer.clear();
      this.viewer.render();
    } finally {
      this.loading.set(false);
    }
  }

  setStyle(style: 'stick' | 'sphere' | 'surface') {
    this.currentStyle = style;
    this.applyCurrentStyle();
  }

  private applyCurrentStyle() {
    if (!this.viewer || !this.$3Dmol) return;
    
    this.viewer.removeAllSurfaces();
    
    if (this.currentStyle === 'stick') {
      this.viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' }, sphere: { scale: 0.3, colorscheme: 'Jmol' } });
    } else if (this.currentStyle === 'sphere') {
      this.viewer.setStyle({}, { sphere: { colorscheme: 'Jmol' } });
    } else if (this.currentStyle === 'surface') {
      this.viewer.setStyle({}, { stick: { radius: 0.15, colorscheme: 'Jmol' } });
      this.viewer.addSurface(this.$3Dmol.SurfaceType.VDW, { opacity: 0.85, color: 'white' });
    }
    
    this.viewer.render();
  }
}
