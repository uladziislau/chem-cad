import { Ingredient } from '../models/ingredient.model';

export const INGREDIENTS: Ingredient[] = [
  { id: 'water', name: 'Дистиллированная вода', type: 'base', description: 'Основа для большинства жидких продуктов.', safety: 'Безопасно.' },
  { id: 'ethanol', name: 'Этиловый спирт (96%)', type: 'solvent', description: 'Растворитель и антисептик.', safety: 'Огнеопасно. Избегать попадания в глаза.' },
  { id: 'glycerin', name: 'Глицерин', type: 'additive', description: 'Увлажняющий агент.', safety: 'Безопасно.' },
  { id: 'sls', name: 'Лаурилсульфат натрия (SLS)', type: 'surfactant', description: 'Сильное поверхностно-активное вещество, пенообразователь.', safety: 'Может вызывать раздражение кожи при высоких концентрациях.' },
  { id: 'coco_glucoside', name: 'Коко-глюкозид', type: 'surfactant', description: 'Мягкое неионогенное ПАВ из кокосового масла.', safety: 'Безопасно, мягкое действие.' },
  { id: 'citric_acid', name: 'Лимонная кислота', type: 'active', description: 'Регулятор pH, удаляет известковый налет.', safety: 'Вызывает раздражение глаз. Использовать перчатки.' },
  { id: 'essential_oil_lavender', name: 'Эфирное масло лаванды', type: 'fragrance', description: 'Ароматизатор с успокаивающим эффектом.', safety: 'Может вызывать аллергическую реакцию. Не наносить в чистом виде на кожу.' },
  { id: 'essential_oil_lemon', name: 'Эфирное масло лимона', type: 'fragrance', description: 'Ароматизатор, обладает легким антибактериальным эффектом.', safety: 'Фототоксично. Избегать солнечных лучей после нанесения на кожу.' },
  { id: 'baking_soda', name: 'Гидрокарбонат натрия (Сода)', type: 'active', description: 'Мягкий абразив, нейтрализатор запахов.', safety: 'Безопасно.' },
];
