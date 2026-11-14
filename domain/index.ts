// Values
export { Concentration } from './values/concentration';
export { HansenVector } from './values/hansen-vector';
export { AcidBaseProfile } from './values/acid-base-profile';
export { DropletSpectrum } from './values/droplet-spectrum';
export { RheologicalProfile } from './values/rheological-profile';
export { DLVOPotential } from './values/dlvo-potential';

// Aspects
export type { IChemicalAspect } from './aspects/chemical-aspect.interface';
export { AcidBaseAspect } from './aspects/acid-base.aspect';
export { SurfaceActiveAspect } from './aspects/surface-active.aspect';
export { VolatilityAspect } from './aspects/volatility.aspect';
export { HansenSolubilityAspect } from './aspects/hansen-solubility.aspect';
export { PolymericNetworkAspect, type PolymerCrosslinkType } from './aspects/polymeric-network.aspect';
export { ElectrokineticAspect } from './aspects/electrokinetic.aspect';
export { ElectrolyteAspect } from './aspects/electrolyte.aspect';
export { LipophilicAspect } from './aspects/lipophilic.aspect';

// Entities (domain model)
export { ChemicalSpecies } from './entities/chemical-species';
export { DomainPhase, type PhaseComponentRecord } from './entities/domain-phase';
export { DomainPhaseBoundary, type AdsorbedSurfactantRecord } from './entities/domain-phase-boundary';
export { ColloidalSystem, type EmulsionMorphology } from './entities/colloidal-system';

// Entities (core formulation model)
export * from './entities/chemical-entity.interface';
export * from './entities/pure-substance';
export * from './entities/mixture';
export * from './entities/surfactant.interface';
export * from './entities/surfactant';
export * from './entities/oil';
export * from './entities/ingredient-metadata.interface';
export * from './entities/phase.interface';
export * from './entities/phase';
export * from './entities/phase-boundary.interface';
export * from './entities/phase-boundary';
export * from './entities/multiphase-system.interface';
export * from './entities/multiphase-system';

// Services
export { PHEquilibriumService, type TitrationPoint } from './services/ph-equilibrium.service';
export { NonNewtonianRheologyService, type RheologyEvaluationOptions } from './services/non-newtonian-rheology.service';
export { ColloidalStabilityService, type StabilityEvaluationContext } from './services/colloidal-stability.service';
