import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AutarkyService, ISegmentInfo } from '../../../shared/services/autarky.service';

@Component({
  selector: 'app-autarky-hub',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header class="text-center mb-16">
        <h1 class="text-4xl font-black text-white mb-4 tracking-tight">Центр Автаркии</h1>
        <p class="text-slate-400 text-lg max-w-2xl mx-auto">
          Выберите вектор развития для обеспечения полной автономности. 
          ChemCore адаптирует инструменты и каталог под выбранную задачу.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (segment of autarky.segments; track segment.id) {
          <button 
            (click)="selectSegment(segment)"
            class="group relative p-8 rounded-3xl border transition-all duration-500 text-left overflow-hidden"
            [ngClass]="[segment.bgClass, segment.borderClass, 'hover:border-' + segment.id + '-500/50']">
            
            <!-- Glow Effect -->
            <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                 [ngClass]="segment.bgClass"></div>

            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/10 bg-slate-900/50 group-hover:scale-110 transition-transform duration-500">
                <span class="text-2xl">{{ getIcon(segment.id) }}</span>
              </div>
              
              <h2 class="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">{{ segment.title }}</h2>
              <p class="text-slate-400 leading-relaxed">{{ segment.description }}</p>
              
              <div class="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                   [ngClass]="segment.colorClass">
                Начать разработку
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>
        }
      </div>

      <footer class="mt-20 pt-8 border-t border-white/5 text-center">
        <div class="inline-flex items-center gap-4 px-6 py-3 bg-slate-900/50 rounded-2xl border border-white/5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-mono text-slate-500 uppercase tracking-widest">Все системы ChemCore активны</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AutarkyHubComponent {
  autarky = inject(AutarkyService);
  router = inject(Router);

  selectSegment(segment: ISegmentInfo) {
    this.autarky.selectSegment(segment.id);
    this.router.navigate(['/lab/dashboard']);
  }

  getIcon(id: string): string {
    switch(id) {
      case 'cosmetics': return '✨';
      case 'household': return '🏠';
      case 'coatings': return '🎨';
      case 'agro': return '🌿';
      default: return '🧪';
    }
  }
}
