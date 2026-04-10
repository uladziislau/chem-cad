import { Injectable, signal } from '@angular/core';
import { FlaskState, Reagent, ReactionRule, ReagentInFlask } from '../models/chemistry.model';
import { REAGENTS, REACTION_RULES } from '../data/chemistry.mock';

@Injectable({
  providedIn: 'root'
})
export class ReactionEngineService {
  private initialState: FlaskState = {
    contents: [],
    totalVolume: 0,
    temperature: 20,
    color: 'transparent',
    isExploded: false,
    activeEffect: 'none'
  };

  flaskState = signal<FlaskState>({ ...this.initialState });
  reactionLog = signal<string[]>(['Лаборатория готова к работе.']);

  getAvailableReagents(): Reagent[] {
    return REAGENTS;
  }

  addReagent(reagentId: string, amount = 10) {
    const reagent = REAGENTS.find(r => r.id === reagentId);
    if (!reagent || this.flaskState().isExploded) return;

    this.flaskState.update(state => {
      const existing = state.contents.find(c => c.reagent.id === reagentId);
      const molesToAdd = amount / reagent.molarMass;
      
      let newContents: ReagentInFlask[];
      if (existing) {
        newContents = state.contents.map(c => 
          c.reagent.id === reagentId 
            ? { ...c, mass: c.mass + amount, moles: c.moles + molesToAdd }
            : c
        );
      } else {
        newContents = [...state.contents, { reagent, mass: amount, moles: molesToAdd }];
      }

      const newVolume = state.totalVolume + (reagent.state === 'liquid' || reagent.state === 'aqueous' ? amount : 0);
      
      return {
        ...state,
        contents: newContents,
        totalVolume: newVolume,
        color: this.calculateAverageColor(newContents)
      };
    });

    this.log(`Добавлено: ${reagent.name} (${amount}г)`);
    this.checkForReactions();
  }

  private checkForReactions() {
    const state = this.flaskState();
    
    for (const rule of REACTION_RULES) {
      if (this.canReactionOccur(rule, state.contents)) {
        this.executeReaction(rule);
        return; // Execute one reaction at a time
      }
    }
  }

  private canReactionOccur(rule: ReactionRule, contents: ReagentInFlask[]): boolean {
    return rule.reactants.every(r => 
      contents.some(c => c.reagent.id === r.reagentId && c.moles > 0.001)
    );
  }

  private executeReaction(rule: ReactionRule) {
    this.flaskState.update(state => {
      // 1. Find limiting reagent
      let maxReactionProgress = Infinity;
      for (const reactant of rule.reactants) {
        const inFlask = state.contents.find(c => c.reagent.id === reactant.reagentId);
        if (inFlask) {
          const possibleProgress = inFlask.moles / reactant.coefficient;
          maxReactionProgress = Math.min(maxReactionProgress, possibleProgress);
        }
      }

      const actualProgress = maxReactionProgress; 

      // 2. Update contents
      const newContents = [...state.contents];

      // Remove reactants
      for (const reactant of rule.reactants) {
        const idx = newContents.findIndex(c => c.reagent.id === reactant.reagentId);
        const molesConsumed = actualProgress * reactant.coefficient;
        const massConsumed = molesConsumed * newContents[idx].reagent.molarMass;
        newContents[idx] = {
          ...newContents[idx],
          moles: Math.max(0, newContents[idx].moles - molesConsumed),
          mass: Math.max(0, newContents[idx].mass - massConsumed)
        };
      }

      // Add products
      for (const product of rule.products) {
        const reagent = REAGENTS.find(r => r.id === product.reagentId)!;
        const molesProduced = actualProgress * product.coefficient;
        const massProduced = molesProduced * reagent.molarMass;

        const existingIdx = newContents.findIndex(c => c.reagent.id === product.reagentId);
        if (existingIdx > -1) {
          newContents[existingIdx] = {
            ...newContents[existingIdx],
            moles: newContents[existingIdx].moles + molesProduced,
            mass: newContents[existingIdx].mass + massProduced
          };
        } else {
          newContents.push({ reagent, moles: molesProduced, mass: massProduced });
        }
      }

      // 3. Energy and Effects
      const energyReleased = -rule.energyChange * actualProgress; // kJ
      const tempRise = (energyReleased * 1000) / (state.totalVolume || 100) / 4.18;
      
      const newTemp = state.temperature + tempRise;
      const isExploded = newTemp > 150 || rule.visualEffect === 'explosion';

      this.log(`⚡ Реакция: ${rule.description}`);
      if (isExploded) this.log(`💥 ВЗРЫВ! Температура превысила критический предел!`);

      return {
        ...state,
        contents: newContents.filter(c => c.moles > 0.0001 && c.reagent.state !== 'gas'),
        temperature: Math.round(newTemp),
        isExploded,
        activeEffect: rule.visualEffect,
        color: rule.resultColor || this.calculateAverageColor(newContents)
      };
    });

    // Reset effect after delay
    setTimeout(() => {
      this.flaskState.update(s => ({ ...s, activeEffect: 'none' }));
    }, 3000);
  }

  private calculateAverageColor(contents: ReagentInFlask[]): string {
    if (contents.length === 0) return 'transparent';
    const main = [...contents].sort((a, b) => b.mass - a.mass)[0];
    return main.reagent.color;
  }

  private log(msg: string) {
    this.reactionLog.update(logs => [msg, ...logs].slice(0, 20));
  }

  resetFlask() {
    this.flaskState.set({ ...this.initialState });
    this.reactionLog.set(['Лаборатория очищена.']);
  }
}
