import { Component, ElementRef, Input, ViewChild, AfterViewInit, OnChanges, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { IMultiphaseSystem } from '../../../../../core/entities/multiphase-system.interface';
import { IPhase } from '../../../../../core/entities/phase.interface';

@Component({
  selector: 'app-microscope-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
      <canvas #canvas class="absolute inset-0 w-full h-full"></canvas>
      
      <!-- Overlay text -->
      <div class="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-slate-400 backdrop-blur-sm border border-white/5">
        100 µm
      </div>
      
      @if (!system || system.phases.length < 2) {
        <div class="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <span class="text-xs text-slate-500 font-mono">NO DISPERSED PHASE</span>
        </div>
      }
    </div>
  `
})
export class MicroscopeViewComponent implements AfterViewInit, OnChanges {
  @Input() system: IMultiphaseSystem | null = null;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    const canvas = this.canvasRef.nativeElement;
    // Set actual size in memory (scaled to account for extra pixel density)
    const rect = canvas.getBoundingClientRect();
    
    // If rect is zero (not yet in DOM or hidden), use a fallback or wait
    const width = rect.width || 300;
    const height = rect.height || 300;

    canvas.width = width * 2;
    canvas.height = height * 2;
    
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(2, 2); // Normalize coordinate system to use css pixels

    this.draw();
  }

  ngOnChanges() {
    if (this.ctx) {
      this.draw();
    }
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.width / 2;
    const height = canvas.height / 2;

    // Clear background (Continuous Phase)
    this.ctx.fillStyle = '#0f172a'; // slate-900
    this.ctx.fillRect(0, 0, width, height);

    if (!this.system || this.system.phases.length < 2) return;

    const dropletSizeUm = this.system.getDropletSize();
    
    // Scale: let's say the canvas width represents 100 µm
    const scale = width / 100.0; 
    const radiusPx = (dropletSizeUm / 2) * scale;

    // Calculate volume fraction (phi)
    const vTotal = this.system.phases.reduce((sum: number, p: IPhase) => sum + p.getVolume().to('ml'), 0);
    const vDispersed = this.system.phases[1].getVolume().to('ml');
    const phi = vTotal > 0 ? vDispersed / vTotal : 0;

    // Estimate number of droplets to draw to match area fraction (roughly volume fraction in 2D slice)
    // Area of one droplet = PI * r^2
    // Total area = width * height
    // Target droplet area = Total area * phi
    // N = Target droplet area / Area of one droplet
    const dropletArea = Math.PI * radiusPx * radiusPx;
    let numDroplets = 0;
    
    if (dropletArea > 0) {
        numDroplets = Math.floor((width * height * phi) / dropletArea);
    }
    
    // Cap the number of droplets for performance
    numDroplets = Math.min(numDroplets, 2000);

    // Draw droplets
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;

    // Simple random distribution (could be improved with Poisson disk sampling for realism)
    // We use a seeded random approach so it doesn't flicker wildly on every tiny change,
    // but for simplicity here we just use Math.random() since it redraws on state change.
    
    // To prevent overlap in a simple way, we just draw them. 
    // In a real emulsion they pack together.
    for (let i = 0; i < numDroplets; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;

      this.ctx.beginPath();
      this.ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Add a little highlight for 3D effect
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(x - radiusPx*0.3, y - radiusPx*0.3, radiusPx*0.2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // reset
    }
  }
}
