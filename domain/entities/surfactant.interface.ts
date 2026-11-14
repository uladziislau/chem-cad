import { IChemicalEntity } from './chemical-entity.interface';
import { IIngredientMetadata } from './ingredient-metadata.interface';

/**
 * Интерфейс для поверхностно-активных веществ (ПАВ)
 */
export interface ISurfactant extends IChemicalEntity, IIngredientMetadata {
    readonly name: string;
    /**
     * Гидрофильно-липофильный баланс (HLB) по Гриффину (обычно от 1 до 20)
     */
    readonly hlb: number;

    /**
     * Характеристическая кривизна (Characteristic Curvature, Cc) для модели HLD.
     * Отрицательные значения - гидрофильные, положительные - липофильные.
     */
    readonly cc?: number;
}

/**
 * Интерфейс для масляных фаз, требующих определенный HLB для эмульгирования
 */
export interface IOil extends IChemicalEntity {
    /**
     * Требуемый HLB для создания стабильной эмульсии "масло-в-воде"
     */
    readonly requiredHlb: number;

    /**
     * Эквивалентное число алкановых углеродов (Equivalent Alkane Carbon Number, EACN).
     */
    readonly eacn?: number;
}
