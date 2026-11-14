import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-jsme-editor',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" style="width: 600px; height: 500px;">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-white/10 bg-slate-800/50 flex justify-between items-center">
        <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
          <mat-icon class="text-sm text-indigo-400">draw</mat-icon>
          2D Редактор Молекул
        </h3>
        <button (click)="editorClose.emit()" class="text-slate-400 hover:text-white transition-colors">
          <mat-icon class="text-sm">close</mat-icon>
        </button>
      </div>
      
      <!-- Editor Canvas -->
      <div class="flex-1 bg-[#E2E8F0] relative p-1" #jsmeContainer>
        @if (loading) {
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
             <span class="text-xs text-slate-400 font-mono">Загрузка движка JSME...</span>
          </div>
        }
      </div>
      
      <!-- Footer Actions -->
      <div class="p-4 bg-slate-800/50 border-t border-white/10 flex justify-between items-center">
        <span class="text-[10px] text-slate-500 font-mono">Работает на базе JSME</span>
        <div class="flex gap-2">
          <button (click)="editorClose.emit()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors">Отмена</button>
          <button (click)="save()" class="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <mat-icon class="text-sm">check</mat-icon>
            Применить SMILES
          </button>
        </div>
      </div>
    </div>
  `
})
export class JsmeEditorComponent implements AfterViewInit {
  @ViewChild('jsmeContainer') container!: ElementRef;
  @Output() editorClose = new EventEmitter<void>();
  @Output() smilesGenerated = new EventEmitter<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsmeApplet: any;
  loading = true;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.loadJsme();
  }

  loadJsme() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    // If already loaded
    if (win.JSApplet) {
      setTimeout(() => this.initJsme(), 100);
      return;
    }

    // JSME calls this global function when it's ready
    win.jsmeOnLoad = () => {
      this.initJsme();
    };

    const script = document.createElement('script');
    script.src = 'https://jsme-editor.github.io/dist/jsme/jsme.nocache.js';
    document.body.appendChild(script);
  }

  initJsme() {
    this.loading = false;
    
    // JSME requires a unique ID for its container
    const id = 'jsme_container_' + Math.random().toString(36).substring(2, 9);
    this.container.nativeElement.id = id;
    
    // Initialize the applet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    this.jsmeApplet = new win.JSApplet.JSME(id, "100%", "100%", {
      options: "oldlook,star,nocanonize"
    });
  }

  save() {
    if (this.jsmeApplet) {
      const smiles = this.jsmeApplet.smiles();
      if (smiles) {
        this.smilesGenerated.emit(smiles);
      } else {
        this.editorClose.emit();
      }
    }
  }
}