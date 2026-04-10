/**
 * Метаданные ингредиента для бизнес-логики и безопасности
 */
export interface IIngredientMetadata {
    /** Цена за килограмм в условных единицах */
    readonly pricePerKg: number;
    
    /** Индекс раздражения кожи (0 - безопасно, 10 - агрессивно) */
    readonly irritationIndex: number;
    
    /** Наличие эко-сертификата */
    readonly isEcoCertified: boolean;
}
