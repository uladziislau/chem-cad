import { Component, input } from '@angular/core';
import { ElementProperties, BondResult } from '../../models/bonding.model';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-bond-visualizer',
  standalone: true,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <div class="w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden flex items-center justify-center">
      
      <!-- Background Grid -->
      <div class="absolute inset-0 opacity-20" 
           style="background-image: radial-gradient(#475569 1px, transparent 1px); background-size: 20px 20px;">
      </div>

      @if (result().type !== 'none') {
        <div class="relative flex items-center justify-center w-full max-w-2xl px-12">
          
          <!-- Atom A -->
          <div class="relative z-20 flex flex-col items-center" [style.transform]="'translateX(' + (result().type === 'ionic' && result().electronShift > 0 ? '-20px' : '0') + ')'">
            <div class="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold font-mono shadow-2xl transition-all duration-500"
                 [style.backgroundColor]="atomA().color"
                 [style.boxShadow]="'0 0 40px ' + atomA().color + '40'">
              {{ atomA().symbol }}
            </div>
            <div class="mt-4 text-slate-400 font-mono text-sm">ЭО: {{ atomA().electronegativity }}</div>
            
            @if (result().type === 'ionic' && result().electronShift > 0) {
              <div class="absolute -top-4 -right-4 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                +
              </div>
            } @else if (result().type === 'ionic' && result().electronShift < 0) {
              <div class="absolute -top-4 -right-4 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                -
              </div>
            } @else if (result().type === 'covalent-polar' && result().electronShift > 0) {
              <div class="absolute -top-4 -right-4 text-rose-400 font-serif italic font-bold text-xl">δ+</div>
            } @else if (result().type === 'covalent-polar' && result().electronShift < 0) {
              <div class="absolute -top-4 -right-4 text-cyan-400 font-serif italic font-bold text-xl">δ-</div>
            }
          </div>

          <!-- Electron Cloud / Bond -->
          <div class="flex-grow h-32 relative z-10 mx-4 flex items-center justify-center">
            <!-- The Cloud -->
            <div class="absolute h-16 bg-cyan-400/30 blur-xl rounded-full transition-all duration-1000 ease-in-out"
                 [style.width]="result().type === 'ionic' ? '40px' : '100%'"
                 [style.left]="result().type === 'ionic' ? (result().electronShift > 0 ? 'calc(100% - 20px)' : '-20px') : '0'"
                 [style.transform]="result().type !== 'ionic' ? 'translateX(' + (result().electronShift * 40) + 'px)' : 'none'">
            </div>
            
            <!-- The Electrons (Dots) -->
            <div class="absolute flex gap-2 transition-all duration-1000 ease-in-out"
                 [style.transform]="'translateX(' + (result().electronShift * 60) + 'px)'">
              <div class="w-4 h-4 bg-cyan-300 rounded-full shadow-[0_0_15px_rgba(103,232,249,0.8)]"></div>
              <div class="w-4 h-4 bg-cyan-300 rounded-full shadow-[0_0_15px_rgba(103,232,249,0.8)]"></div>
            </div>

            <!-- Force Indicators -->
            @if (result().type !== 'ionic') {
              <div class="absolute top-0 w-full flex justify-between px-4 text-slate-500">
                <mat-icon [class.text-rose-400]="result().electronShift < -0.2" class="transition-colors">keyboard_double_arrow_left</mat-icon>
                <mat-icon [class.text-rose-400]="result().electronShift > 0.2" class="transition-colors">keyboard_double_arrow_right</mat-icon>
              </div>
            }
          </div>

          <!-- Atom B -->
          <div class="relative z-20 flex flex-col items-center" [style.transform]="'translateX(' + (result().type === 'ionic' && result().electronShift < 0 ? '20px' : '0') + ')'">
            <div class="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold font-mono shadow-2xl transition-all duration-500"
                 [style.backgroundColor]="atomB().color"
                 [style.boxShadow]="'0 0 40px ' + atomB().color + '40'">
              {{ atomB().symbol }}
            </div>
            <div class="mt-4 text-slate-400 font-mono text-sm">ЭО: {{ atomB().electronegativity }}</div>

            @if (result().type === 'ionic' && result().electronShift < 0) {
              <div class="absolute -top-4 -left-4 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                +
              </div>
            } @else if (result().type === 'ionic' && result().electronShift > 0) {
              <div class="absolute -top-4 -left-4 w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg animate-bounce">
                -
              </div>
            } @else if (result().type === 'covalent-polar' && result().electronShift < 0) {
              <div class="absolute -top-4 -left-4 text-rose-400 font-serif italic font-bold text-xl">δ+</div>
            } @else if (result().type === 'covalent-polar' && result().electronShift > 0) {
              <div class="absolute -top-4 -left-4 text-cyan-400 font-serif italic font-bold text-xl">δ-</div>
            }
          </div>

        </div>
      } @else {
        <div class="text-center">
          <div class="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <mat-icon class="text-4xl text-slate-600">block</mat-icon>
          </div>
          <p class="text-slate-400 text-lg">Взаимодействие невозможно</p>
        </div>
      }

      <!-- Legend -->
      <div class="absolute bottom-4 left-4 text-slate-400 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-700">
        ΔEN: {{ result().deltaEN | number:'1.1-2' }}
      </div>
    </div>
  `
})
export class BondVisualizerComponent {
  atomA = input.required<ElementProperties>();
  atomB = input.required<ElementProperties>();
  result = input.required<BondResult>();
}
