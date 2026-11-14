import { Recipe } from '@root-modules/recipe/models/recipe.model';

export const RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Универсальное моющее средство',
    category: 'cleaning',
    description: 'Простое и безопасное средство для мытья поверхностей на основе мягких ПАВ.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'water', percentage: 85, purpose: 'Основа' },
      { ingredientId: 'coco_glucoside', percentage: 10, purpose: 'Очищение и пенообразование' },
      { ingredientId: 'citric_acid', percentage: 3, purpose: 'Регулировка pH и удаление налета' },
      { ingredientId: 'essential_oil_lemon', percentage: 2, purpose: 'Ароматизация' },
    ],
    steps: [
      { text: 'Отмерьте необходимое количество дистиллированной воды в чистую емкость.', ingredientIds: ['water'] },
      { text: 'Медленно добавьте коко-глюкозид, аккуратно перемешивая, чтобы избежать сильного пенообразования.', ingredientIds: ['coco_glucoside'] },
      { text: 'Растворите лимонную кислоту в небольшом количестве воды и добавьте в общую смесь.', ingredientIds: ['citric_acid', 'water'] },
      { text: 'Добавьте эфирное масло лимона и тщательно перемешайте.', ingredientIds: ['essential_oil_lemon'] },
      { text: 'Перелейте готовое средство в флакон с распылителем.' }
    ],
    safetyWarnings: [
      'Используйте защитные очки при работе с лимонной кислотой.',
      'Проводите смешивание в хорошо проветриваемом помещении.'
    ]
  },
  {
    id: 'r2',
    name: 'Мягкое жидкое мыло для рук',
    category: 'hygiene',
    description: 'Увлажняющее мыло для рук, подходящее для частого использования.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'water', percentage: 70, purpose: 'Основа' },
      { ingredientId: 'coco_glucoside', percentage: 20, purpose: 'Мягкое очищение' },
      { ingredientId: 'glycerin', percentage: 8, purpose: 'Увлажнение кожи' },
      { ingredientId: 'essential_oil_lavender', percentage: 2, purpose: 'Аромат и успокаивающий эффект' },
    ],
    steps: [
      { text: 'Нагрейте воду до 40-50°C для лучшего растворения компонентов.', ingredientIds: ['water'] },
      { text: 'Добавьте коко-глюкозид и аккуратно перемешайте.', ingredientIds: ['coco_glucoside'] },
      { text: 'Вмешайте глицерин до получения однородной массы.', ingredientIds: ['glycerin'] },
      { text: 'Остудите смесь до комнатной температуры и добавьте эфирное масло лаванды.', ingredientIds: ['essential_oil_lavender'] },
      { text: 'Перелейте в дозатор для мыла.' }
    ],
    safetyWarnings: [
      'Избегайте попадания концентрированного эфирного масла на кожу до его разбавления.'
    ]
  },
  {
    id: 'r3',
    name: 'Базовый парфюмерный спрей',
    category: 'perfume',
    description: 'Простой парфюмерный спрей на спиртовой основе.',
    difficulty: 'medium',
    ingredients: [
      { ingredientId: 'ethanol', percentage: 70, purpose: 'Растворитель и база' },
      { ingredientId: 'water', percentage: 20, purpose: 'Разбавитель' },
      { ingredientId: 'glycerin', percentage: 5, purpose: 'Фиксатор аромата' },
      { ingredientId: 'essential_oil_lavender', percentage: 5, purpose: 'Ароматическая композиция' },
    ],
    steps: [
      { text: 'В стеклянной емкости смешайте этиловый спирт и эфирное масло.', ingredientIds: ['ethanol', 'essential_oil_lavender'], durationMinutes: 1440 },
      { text: 'Тщательно перемешайте и оставьте на 24 часа в темном месте для мацерации.', durationMinutes: 1440 },
      { text: 'Добавьте дистиллированную воду и глицерин.', ingredientIds: ['water', 'glycerin'] },
      { text: 'Перемешайте, профильтруйте (при необходимости) и перелейте во флакон с пульверизатором.' },
      { text: 'Дайте настояться еще 1-2 недели для полного раскрытия аромата.', durationMinutes: 1440 }
    ],
    safetyWarnings: [
      'Этиловый спирт крайне огнеопасен! Держите вдали от открытого огня и источников тепла.',
      'Работайте в помещении с хорошей вытяжкой.'
    ]
  },
  {
    id: 'r4',
    name: 'Гель для душа с SLS',
    category: 'hygiene',
    description: 'Классический гель для душа с сильным пенообразованием.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'water', percentage: 75, purpose: 'Основа' },
      { ingredientId: 'sls', percentage: 15, purpose: 'Пенообразование и очищение' },
      { ingredientId: 'cocamidopropyl_betaine', percentage: 5, purpose: 'Усиление пены, мягкость' },
      { ingredientId: 'citric_acid', percentage: 2, purpose: 'Регулировка pH' },
      { ingredientId: 'sodium_chloride', percentage: 2, purpose: 'Загуститель' },
      { ingredientId: 'phenoxyethanol', percentage: 1, purpose: 'Консервант' },
    ],
    steps: [
      { text: 'Растворите SLS в горячей воде (60-70°C) до полного растворения.', ingredientIds: ['sls', 'water'], durationMinutes: 15 },
      { text: 'Остудите до 40°C, добавьте кокоамидопропилбетаин.', ingredientIds: ['cocamidopropyl_betaine'] },
      { text: 'Растворите лимонную кислоту в небольшом количестве воды и добавьте.', ingredientIds: ['citric_acid', 'water'] },
      { text: 'Постепенно добавляйте соль, помешивая, до нужной густоты.', ingredientIds: ['sodium_chloride'] },
      { text: 'Добавьте консервант и эфирное масло, перемешайте.', ingredientIds: ['phenoxyethanol'] },
      { text: 'Перелейте в флакон.' }
    ],
    safetyWarnings: [
      'SLS может вызывать раздражение при длительном контакте с кожей.',
      'Работайте в перчатках при работе с концентрированными ПАВ.'
    ]
  },
  {
    id: 'r5',
    name: 'Крем для рук с маслом шиповника',
    category: 'hygiene',
    description: 'Питательный крем с натуральными маслами.',
    difficulty: 'medium',
    ingredients: [
      { ingredientId: 'water', percentage: 65, purpose: 'Водная фаза' },
      { ingredientId: 'glycerin', percentage: 8, purpose: 'Увлажнение' },
      { ingredientId: 'coconut_oil', percentage: 12, purpose: 'Питание и смягчение' },
      { ingredientId: 'jojoba_oil', percentage: 8, purpose: 'Лёгкое масло, не забивает поры' },
      { ingredientId: 'beeswax', percentage: 4, purpose: 'Загуститель' },
      { ingredientId: 'sodium_lactate', percentage: 2, purpose: 'Увлажняющий агент' },
      { ingredientId: 'leucidal', percentage: 1, purpose: 'Консервант' },
    ],
    steps: [
      { text: 'Растопите кокосовое масло и воск на водяной бане (70-80°C).', ingredientIds: ['coconut_oil', 'beeswax'], durationMinutes: 20 },
      { text: 'Отдельно нагрейте воду с глицерином и лактатом натрия.', ingredientIds: ['water', 'glycerin', 'sodium_lactate'] },
      { text: 'Постепенно вливайте водную фазу в масляную, интенсивно взбивая.' },
      { text: 'Добавьте масло жожоба и продолжайте взбивать до остывания.', ingredientIds: ['jojoba_oil'] },
      { text: 'Добавьте консервант и перемешайте.', ingredientIds: ['leucidal'] },
      { text: 'Перелейте в баночку.' }
    ],
    safetyWarnings: [
      'При работе с горячими маслами используйте прихватки.',
      'Не допускайте попадания воды в масляную фазу до соединения.'
    ]
  },
  {
    id: 'r6',
    name: 'Антисептик для рук (COVID-формула)',
    category: 'hygiene',
    description: 'Спиртовой антисептик по ВОЗ-рекомендации.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'ethanol', percentage: 80, purpose: 'Антисептическое действие' },
      { ingredientId: 'water', percentage: 15, purpose: 'Разбавление' },
      { ingredientId: 'glycerin', percentage: 4, purpose: 'Защита кожи от сухости' },
      { ingredientId: 'hydrogen_peroxide', percentage: 1, purpose: 'Удаление спор' },
    ],
    steps: [
      { text: 'Отмерьте этиловый спирт в чистую емкость.', ingredientIds: ['ethanol'] },
      { text: 'Добавьте перекись водорода и перемешайте.', ingredientIds: ['hydrogen_peroxide'] },
      { text: 'Добавьте глицерин и перемешайте до растворения.', ingredientIds: ['glycerin'] },
      { text: 'Медленно добавьте дистиллированную воду, перемешивая.', ingredientIds: ['water'] },
      { text: 'Перелейте в флакон с дозатором.' }
    ],
    safetyWarnings: [
      'Этиловый спирт огнеопасен. Храните вдали от огня.',
      'Не применяйте на открытые раны.'
    ]
  },
  {
    id: 'r7',
    name: 'Сухой шампунь с крахмалом',
    category: 'hygiene',
    description: 'Поглощает жир с кожи головы без воды.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'rice_starch', percentage: 70, purpose: 'Поглощение жира' },
      { ingredientId: 'baking_soda', percentage: 20, purpose: 'Дезодорация' },
      { ingredientId: 'essential_oil_lavender', percentage: 5, purpose: 'Аромат' },
      { ingredientId: 'kaolin_clay', percentage: 5, purpose: 'Матирование' },
    ],
    steps: [
      { text: 'Смешайте рисовый крахмал и соду в сухой миске.', ingredientIds: ['rice_starch', 'baking_soda'] },
      { text: 'Добавьте каолиновую глину и перемешайте.', ingredientIds: ['kaolin_clay'] },
      { text: 'Капните эфирное масло и тщательно перемешайте.', ingredientIds: ['essential_oil_lavender'] },
      { text: 'Пересыпьте в баночку с ситечком.' }
    ],
    safetyWarnings: [
      'Избегайте вдыхания порошка при смешивании.',
      'Тщательно смойте с кожи головы перед мытьём.'
    ]
  },
  {
    id: 'r8',
    name: 'Скраб для тела с кофейной гущей',
    category: 'hygiene',
    description: 'Отшелушивающий скраб с антицеллюлитным эффектом.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'coffee_grounds', percentage: 50, purpose: 'Абразивное отшелушивание' },
      { ingredientId: 'coconut_oil', percentage: 30, purpose: 'Питание и связующее' },
      { ingredientId: 'sugar', percentage: 15, purpose: 'Мягкий абразив' },
      { ingredientId: 'essential_oil_coffee', percentage: 5, purpose: 'Ароматизация' },
    ],
    steps: [
      { text: 'Смешайте кофейную гущу и сахар в миске.', ingredientIds: ['coffee_grounds', 'sugar'] },
      { text: 'Растопите кокосовое масло и влейте в смесь.', ingredientIds: ['coconut_oil'] },
      { text: 'Добавьте эфирное масло и перемешайте.', ingredientIds: ['essential_oil_coffee'] },
      { text: 'Переложите в баночку. Использовать в течение 2 недель.', durationMinutes: 10080 }
    ],
    safetyWarnings: [
      'Не используйте на повреждённой или раздражённой коже.',
      'Избегайте попадания в глаза.'
    ]
  },
  {
    id: 'r9',
    name: 'Тоник для лица с розовой водой',
    category: 'hygiene',
    description: 'Освежающий и успокаивающий тонер.',
    difficulty: 'easy',
    ingredients: [
      { ingredientId: 'rose_water', percentage: 85, purpose: 'Основа, успокаивание' },
      { ingredientId: 'glycerin', percentage: 8, purpose: 'Увлажнение' },
      { ingredientId: 'vitamin_c', percentage: 5, purpose: 'Антиоксидант, осветление' },
      { ingredientId: 'leucidal', percentage: 2, purpose: 'Консервант' },
    ],
    steps: [
      { text: 'Смешайте розовую воду и глицерин.', ingredientIds: ['rose_water', 'glycerin'] },
      { text: 'Растворите витамин C в небольшом количестве воды.', ingredientIds: ['vitamin_c', 'water'] },
      { text: 'Добавьте витамин C к основной смеси.' },
      { text: 'Добавьте консервант и перемешайте.', ingredientIds: ['leucidal'] },
      { text: 'Перелейте в флакон с распылителем.' }
    ],
    safetyWarnings: [
      'Витамин C может вызывать лёгкое покалывание при первом применении.',
      'Хранить в холодильнике для продления срока годности.'
    ]
  },
  {
    id: 'r10',
    name: 'Зубная паста натуральная',
    category: 'hygiene',
    description: 'Мягкая зубная паста без фтора.',
    difficulty: 'medium',
    ingredients: [
      { ingredientId: 'calcium_carbonate', percentage: 45, purpose: 'Абразив' },
      { ingredientId: 'glycerin', percentage: 25, purpose: 'Влажность и текстура' },
      { ingredientId: 'water', percentage: 15, purpose: 'Основа' },
      { ingredientId: 'xanthan_gum', percentage: 3, purpose: 'Загуститель' },
      { ingredientId: 'peppermint_oil', percentage: 2, purpose: 'Вкус и свежесть' },
      { ingredientId: 'stevia', percentage: 1, purpose: 'Подсластитель' },
      { ingredientId: 'leucidal', percentage: 1, purpose: 'Консервант' },
    ],
    steps: [
      { text: 'Смешайте кальций карбонат с глицерином до пастообразного состояния.', ingredientIds: ['calcium_carbonate', 'glycerin'] },
      { text: 'Добавьте воду, затем загуститель (ксантановую камедь).', ingredientIds: ['water', 'xanthan_gum'] },
      { text: 'Добавьте эфирное масло мяты и стевию.', ingredientIds: ['peppermint_oil', 'stevia'] },
      { text: 'Добавьте консервант и перемешайте до однородности.', ingredientIds: ['leucidal'] },
      { text: 'Переложите в тубу.' }
    ],
    safetyWarnings: [
      'Без фтора — не подходит для людей с высоким риском кариеса.',
      'Использовать в течение 1 месяца после вскрытия.'
    ]
  },
];
