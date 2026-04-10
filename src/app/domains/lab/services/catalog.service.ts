import { Injectable } from '@angular/core';
import { PureSubstance } from '../../../../core/entities/pure-substance';
import { Oil } from '../../../../core/entities/oil';
import { Surfactant } from '../../../../core/entities/surfactant';
import { IChemicalEntity } from '../../../../core/entities/chemical-entity.interface';

export type IngredientCategory = 'water' | 'oil' | 'surfactant' | 'active' | 'thickener' | 'solvent' | 'pigment';
export type ProductSegment = 'cosmetics' | 'household' | 'coatings' | 'agro';

export interface ICatalogIngredient {
  id: string;
  name: string;
  inci: string;
  category: IngredientCategory;
  segments: ProductSegment[];
  pricePerKg: number;
  description: string;
  entity: IChemicalEntity;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly catalog: ICatalogIngredient[] = [
    {
      id: 'ing_water',
      name: 'Вода очищенная',
      inci: 'Aqua',
      category: 'water',
      segments: ['cosmetics', 'household', 'coatings', 'agro'],
      pricePerKg: 0.1,
      description: 'Универсальный растворитель, основа большинства косметических средств.',
      entity: new PureSubstance('Water', 18.015, 8.07131, 1730.63, 233.426, 1.0, 0, 0.001, 1900).withHansen(15.6, 16.0, 42.3)
    },
    {
      id: 'ing_glycerin',
      name: 'Глицерин растительный',
      inci: 'Glycerin',
      category: 'water',
      segments: ['cosmetics', 'household'],
      pricePerKg: 3.5,
      description: 'Мощный увлажнитель (хумектант), притягивает влагу.',
      entity: new PureSubstance('Glycerin', 92.09, 0, 0, 0, 1.26, 18, 0.00001, 4000).withHansen(17.4, 11.3, 29.3)
    },
    {
      id: 'ing_almond_oil',
      name: 'Масло миндальной косточки',
      inci: 'Prunus Amygdalus Dulcis Oil',
      category: 'oil',
      segments: ['cosmetics'],
      pricePerKg: 12.0,
      description: 'Легкое питательное масло, богатое олеиновой кислотой.',
      entity: new Oil('Almond Oil', 800, 6.0, 0, 0, false, 0, 0, 0, 0.9, -10, 0.0001, 3500, 0, 12).withHansen(16.0, 3.0, 4.0)
    },
    {
      id: 'ing_shea_butter',
      name: 'Масло Ши (Карите)',
      inci: 'Butyrospermum Parkii Butter',
      category: 'oil',
      segments: ['cosmetics'],
      pricePerKg: 15.0,
      description: 'Твердое масло (баттер), отличные защитные свойства.',
      entity: new Oil('Shea Butter', 850, 8.0, 0, 0, false, 0, 0, 0, 0.92, 35, 0.0001, 4000, 0, 14).withHansen(16.0, 3.0, 4.0)
    },
    {
      id: 'ing_polysorbate_20',
      name: 'Полисорбат-20',
      inci: 'Polysorbate 20',
      category: 'surfactant',
      segments: ['cosmetics', 'household'],
      pricePerKg: 8.0,
      description: 'Неионогенный ПАВ, солюбилизатор. HLB = 16.7.',
      entity: new Surfactant('Polysorbate-20', 1228, 16.7, 0, 0, false, 0, 0, 0, 1.1, -5, 0.00005, 4500, 0, -2.0).withHansen(16.0, 8.0, 10.0)
    },
    {
      id: 'ing_cetyl_alcohol',
      name: 'Цетиловый спирт',
      inci: 'Cetyl Alcohol',
      category: 'thickener',
      segments: ['cosmetics'],
      pricePerKg: 6.5,
      description: 'Жирный спирт, соэмульгатор и загуститель для эмульсий.',
      entity: new Oil('Cetyl Alcohol', 242.44, 15.5, 0, 0, false, 0, 0, 0, 0.81, 49, 0.0001, 3800, 0, 10).withHansen(16.2, 3.0, 9.0)
    },
    {
      id: 'ing_jojoba_oil',
      name: 'Масло жожоба (воск)',
      inci: 'Simmondsia Chinensis Seed Oil',
      category: 'oil',
      segments: ['cosmetics'],
      pricePerKg: 45.0,
      description: 'Жидкий воск, по составу близок к себуму кожи. Очень стабильно.',
      entity: new Oil('Jojoba Oil', 600, 6.5, 45, 0, true, 0, 0, 0, 0.86, 10, 0.0001, 3600, 0, 15).withHansen(16.0, 2.0, 3.0)
    },
    {
      id: 'ing_caprylic',
      name: 'Каприлик/Каприк Триглицериды',
      inci: 'Caprylic/Capric Triglyceride',
      category: 'oil',
      segments: ['cosmetics'],
      pricePerKg: 9.5,
      description: 'Фракционированное кокосовое масло. Легкий эмолент, не окисляется.',
      entity: new Oil('Caprylic Triglycerides', 408, 5.0, 9.5, 0, false, 0, 0, 0, 0.95, -5, 0.0001, 3200, 0, 9).withHansen(16.0, 4.0, 5.0)
    },
    {
      id: 'ing_olivem_1000',
      name: 'Olivem 1000',
      inci: 'Cetearyl Olivate, Sorbitan Olivate',
      category: 'surfactant',
      segments: ['cosmetics'],
      pricePerKg: 35.0,
      description: 'Растительный эмульгатор из оливкового масла. Создает жидкокристаллические структуры.',
      entity: new Surfactant('Olivem 1000', 500, 9.0, 35, 0, true, 0, 0, 0, 1.05, 65, 0.0001, 4200, 0, -0.5).withHansen(16.5, 5.0, 8.0)
    },
    {
      id: 'ing_glyceryl_stearate',
      name: 'Глицерил Стеарат',
      inci: 'Glyceryl Stearate',
      category: 'surfactant',
      segments: ['cosmetics'],
      pricePerKg: 7.0,
      description: 'Низко-HLB эмульгатор (HLB 3.8). Используется как со-эмульгатор.',
      entity: new Surfactant('Glyceryl Stearate', 358.56, 3.8, 7, 0, false, 0, 0, 0, 0.97, 55, 0.0001, 4000, 0, 1.5).withHansen(16.0, 4.0, 6.0)
    },
    {
      id: 'ing_panthenol',
      name: 'Д-Пантенол (75%)',
      inci: 'Panthenol',
      category: 'active',
      segments: ['cosmetics'],
      pricePerKg: 28.0,
      description: 'Провитамин B5. Заживляет, успокаивает и увлажняет кожу.',
      entity: new PureSubstance('Panthenol', 205.25, 0, 0, 0, 1.2, -20, 0.00001, 5000).withHansen(17.0, 10.0, 25.0)
    },
    {
      id: 'ing_xanthan_gum',
      name: 'Ксантановая камедь',
      inci: 'Xanthan Gum',
      category: 'thickener',
      segments: ['cosmetics', 'household', 'coatings'],
      pricePerKg: 18.0,
      description: 'Натуральный гелеобразователь и стабилизатор эмульсий.',
      entity: new PureSubstance('Xanthan Gum', 1000000, 0, 0, 0, 1.5, 300, 0.01, 1500, -1).withSolubility(1, 0.5)
    },
    {
      id: 'ing_citric_acid',
      name: 'Лимонная кислота',
      inci: 'Citric Acid',
      category: 'active',
      segments: ['cosmetics', 'household'],
      pricePerKg: 5.0,
      description: 'Регулятор pH, хелатирующий агент.',
      entity: new PureSubstance('Citric Acid', 192.12, 0, 0, 0, 1.66, 153, 0.001, 2000, 0).withHansen(17.0, 12.0, 20.0).withElectrolyte('acid', [3.13, 4.76, 6.40])
    },
    {
      id: 'ing_sodium_hydroxide',
      name: 'Натрия гидроксид (10%)',
      inci: 'Sodium Hydroxide',
      category: 'active',
      segments: ['cosmetics', 'household'],
      pricePerKg: 4.0,
      description: 'Сильная щелочь для повышения pH.',
      entity: new PureSubstance('Sodium Hydroxide', 40.0, 0, 0, 0, 1.1, 318, 0.001, 1800, 1).withElectrolyte('base', 13.8) // Сильное основание
    },
    {
      id: 'ing_salt',
      name: 'Морская соль',
      inci: 'Sodium Chloride',
      category: 'active',
      segments: ['cosmetics', 'household'],
      pricePerKg: 2.0,
      description: 'Электролит, влияет на вязкость и стабильность.',
      entity: new PureSubstance('Sodium Chloride', 58.44, 0, 0, 0, 2.16, 801, 0.001, 1500, 1).withElectrolyte('salt')
    },
    // --- НОВЫЕ ИНГРЕДИЕНТЫ ДЛЯ АВТАРКИИ ---
    {
      id: 'ing_isopropanol',
      name: 'Изопропиловый спирт',
      inci: 'Isopropyl Alcohol',
      category: 'solvent',
      segments: ['household', 'coatings'],
      pricePerKg: 6.0,
      description: 'Мощный растворитель. Быстро испаряется, не оставляет разводов (для стекол).',
      entity: new PureSubstance('Isopropanol', 60.1, 0, 0, 0, 0.786, -89, 0.0005, 1200).withHansen(15.8, 6.1, 16.4)
    },
    {
      id: 'ing_linseed_oil',
      name: 'Льняное масло (Олифа)',
      inci: 'Linseed Oil',
      category: 'oil',
      segments: ['coatings'],
      pricePerKg: 8.0,
      description: 'Высыхающее масло. Полимеризуется на воздухе, образуя защитную пленку для дерева.',
      entity: new Oil('Linseed Oil', 878, 0, 8, 0, false, 0, 0, 0, 0.93, -20, 0.0001, 3500, 0, 13).withHansen(16.0, 3.0, 4.0)
    },
    {
      id: 'ing_acetic_acid',
      name: 'Уксусная кислота (9%)',
      inci: 'Acetic Acid',
      category: 'active',
      segments: ['household'],
      pricePerKg: 1.5,
      description: 'Слабая кислота. Отличный очиститель поверхностей и кондиционер для белья.',
      entity: new PureSubstance('Acetic Acid', 60.05, 0, 0, 0, 1.01, 16.6, 0.001, 1500, 0).withHansen(14.5, 8.0, 13.5).withElectrolyte('acid', 4.76)
    },
    {
      id: 'ing_scs',
      name: 'Кокосульфат натрия (SCS)',
      inci: 'Sodium Coco-Sulfate',
      category: 'surfactant',
      segments: ['cosmetics', 'household'],
      pricePerKg: 12.0,
      description: 'Анионный ПАВ из кокосового масла. Дает обильную пену.',
      entity: new Surfactant('Sodium Coco-Sulfate', 232, 40, 12, 5, false, 0, 0, 0, 1.1, 20, 0.0001, 3000, -1, -3.0).withHansen(16.0, 10.0, 12.0).withElectrolyte('salt')
    },
    {
      id: 'ing_cetrimonium',
      name: 'Цетримониум хлорид',
      inci: 'Cetrimonium Chloride',
      category: 'surfactant',
      segments: ['cosmetics'],
      pricePerKg: 18.0,
      description: 'Катионный ПАВ. Кондиционирующий агент, антистатик.',
      entity: new Surfactant('Cetrimonium Chloride', 320, 15, 18, 3, false, 0, 0, 0, 0.9, 0, 0.0001, 2500, 1, -2.5).withHansen(16.0, 8.0, 10.0).withElectrolyte('salt')
    }
  ];

  private dynamicIngredients: ICatalogIngredient[] = [];

  getAllIngredients(): ICatalogIngredient[] {
    return [...this.catalog, ...this.dynamicIngredients];
  }

  addIngredient(ingredient: ICatalogIngredient): void {
    this.dynamicIngredients.push(ingredient);
  }

  getIngredientById(id: string): ICatalogIngredient | undefined {
    return this.getAllIngredients().find(ing => ing.id === id);
  }
}
