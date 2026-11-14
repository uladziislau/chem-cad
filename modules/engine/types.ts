import { IChemicalEntity } from '@domain/entities/chemical-entity.interface';

export interface RawIngredientInput {
  entity: IChemicalEntity;
  massGrams: number;
  category: string;
}
