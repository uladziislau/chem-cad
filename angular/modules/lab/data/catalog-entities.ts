import { PureSubstance } from '@domain/entities/pure-substance';
import { FormulationEntity } from '@domain/entities/formulation-entity';
import { Phase } from '@domain/entities/phase';
import { Mixture } from '@domain/entities/mixture';
import { MultiphaseSystem } from '@domain/entities/multiphase-system';
import { Mass } from '@root-modules/units/quantities';

const CATALOG_WATER = new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0, 0, 0.001, 1900).withHansen(15.6, 16.0, 42.3);
const PURE_NAOH = new PureSubstance('Sodium Hydroxide', 40.0, 0, 0, 0, 2.13, 318, 0.001, 1800, 1).withElectrolyte('base', 13.8);
const PURE_ACETIC_ACID = new PureSubstance('Acetic Acid', 60.05, 0, 0, 0, 1.049, 16.6, 0.001, 1500, 0).withHansen(14.5, 8.0, 13.5).withElectrolyte('acid', 4.76);

export function createAqueousSolution(name: string, solute: PureSubstance, percentSolute: number): FormulationEntity {
  const waterMass = 100 - percentSolute;
  const recipe = [
    { entity: CATALOG_WATER, massGrams: waterMass, category: 'water' },
    { entity: solute, massGrams: percentSolute, category: 'active' }
  ];
  const phase = new Phase(new Mixture(), new Mass(100, 'g'), 25);
  phase.composition.addComponent(CATALOG_WATER, new Mass(waterMass, 'g'));
  phase.composition.addComponent(solute, new Mass(percentSolute, 'g'));
  return new FormulationEntity(name, recipe, new MultiphaseSystem([phase], []));
}

export { CATALOG_WATER, PURE_NAOH, PURE_ACETIC_ACID };
