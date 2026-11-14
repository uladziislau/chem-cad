import { describe, it, expect } from 'vitest';
import { formulationToRecipe, FormulationExportItem } from '@root-modules/recipe/formulation-export';

const water: FormulationExportItem = {
  ingredientId: 'water', name: 'Вода', type: 'base',
  description: 'Основа', safety: 'Безопасно.', percentage: 70,
};
const sls: FormulationExportItem = {
  ingredientId: 'sls', name: 'SLS', type: 'surfactant',
  description: 'ПАВ', safety: 'Может вызывать раздражение кожи при высоких концентрациях.', percentage: 25,
};
const lavender: FormulationExportItem = {
  ingredientId: 'lav', name: 'Лаванда', type: 'fragrance',
  description: 'Аромат', safety: 'Может вызывать аллергическую реакцию. Не наносить в чистом виде.', percentage: 5,
};

describe('formulationToRecipe', () => {
  it('маппит ингредиенты: id, percentage, purpose из description', () => {
    const r = formulationToRecipe([water, sls], { name: 'Тест', category: 'hygiene' });
    expect(r.ingredients).toEqual([
      { ingredientId: 'water', percentage: 70, purpose: 'Основа' },
      { ingredientId: 'sls', percentage: 25, purpose: 'ПАВ' },
    ]);
  });

  it('фильтрует ингредиенты с percentage <= 0', () => {
    const r = formulationToRecipe([water, { ...sls, percentage: 0 }], { name: 'Тест', category: 'hygiene' });
    expect(r.ingredients).toHaveLength(1);
    expect(r.ingredients[0].ingredientId).toBe('water');
  });

  it('purpose fallback на type при пустом description', () => {
    const r = formulationToRecipe([{ ...water, description: '' }], { name: 'Тест', category: 'hygiene' });
    expect(r.ingredients[0].purpose).toBe('base');
  });

  it('генерирует шаги: подготовка + по шагу на ингредиент + финал', () => {
    const r = formulationToRecipe([water, sls], { name: 'Тест', category: 'hygiene' });
    expect(r.steps).toHaveLength(4);
    expect(r.steps[0].text).toContain('Подготовьте');
    expect(r.steps[1].ingredientIds).toEqual(['water']);
    expect(r.steps[1].text).toContain('Вода');
    expect(r.steps[2].ingredientIds).toEqual(['sls']);
    expect(r.steps[3].text).toContain('перелейте');
  });

  it('safetyWarnings: реальные предупреждения, без "Безопасно"', () => {
    const r = formulationToRecipe([water, sls], { name: 'Тест', category: 'hygiene' });
    expect(r.safetyWarnings).toEqual([sls.safety]);
  });

  it('добавляет предупреждение про ароматические компоненты', () => {
    const r = formulationToRecipe([water, lavender], { name: 'Тест', category: 'perfume' });
    expect(r.safetyWarnings.some(w => w.includes('ароматические'))).toBe(true);
    expect(r.safetyWarnings).toContain(lavender.safety);
  });

  it('дефолты: пустое имя → "Моя рецептура", пустое описание → автотекст', () => {
    const r = formulationToRecipe([water], { name: '  ', category: 'cleaning' });
    expect(r.name).toBe('Моя рецептура');
    expect(r.description).toContain('формулятора');
    expect(r.difficulty).toBe('easy');
  });

  it('кастомное описание сохраняется', () => {
    const r = formulationToRecipe([water], { name: 'N', category: 'hygiene', description: 'Моё описание' });
    expect(r.description).toBe('Моё описание');
  });
});
