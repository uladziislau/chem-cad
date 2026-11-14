import { Ingredient } from '@root-modules/formulation/models/ingredient.model';

export const INGREDIENTS: Ingredient[] = [
  // Базовые компоненты
  { id: 'water', name: 'Дистиллированная вода', type: 'base', description: 'Основа для большинства жидких продуктов.', safety: 'Безопасно.' },
  { id: 'ethanol', name: 'Этиловый спирт (96%)', type: 'solvent', description: 'Растворитель и антисептик.', safety: 'Огнеопасно. Избегать попадания в глаза.' },
  { id: 'glycerin', name: 'Глицерин', type: 'additive', description: 'Увлажняющий агент, фиксатор аромата.', safety: 'Безопасно.' },
  { id: 'propylene_glycol', name: 'Пропиленгликоль', type: 'solvent', description: 'Растворитель, увлажнитель.', safety: 'Безопасно в низких концентрациях.' },

  // ПАВ
  { id: 'sls', name: 'Лаурилсульфат натрия (SLS)', type: 'surfactant', description: 'Сильное анионное ПАВ, пенообразователь.', safety: 'Может вызывать раздражение кожи при высоких концентрациях.' },
  { id: 'sles', name: 'Лаурилэфирсульфат натрия (SLES)', type: 'surfactant', description: 'Мягкое анионное ПАВ, более щадящее чем SLS.', safety: 'Относительно безопасно.' },
  { id: 'coco_glucoside', name: 'Коко-глюкозид', type: 'surfactant', description: 'Мягкое неионогенное ПАВ из кокосового масла.', safety: 'Безопасно, мягкое действие.' },
  { id: 'cocamidopropyl_betaine', name: 'Кокамидопропилбетаин', type: 'surfactant', description: 'Амфотерное ПАВ, улучшает пенообразование.', safety: 'Может вызывать аллергическую реакцию у чувствительной кожи.' },
  { id: 'decyl_glucoside', name: 'Децилглюкозид', type: 'surfactant', description: 'Мягкое неионогенное ПАВ для чувствительной кожи.', safety: 'Очень безопасно.' },

  // Активные компоненты
  { id: 'citric_acid', name: 'Лимонная кислота', type: 'active', description: 'Регулятор pH, хелатор, удаляет известковый налет.', safety: 'Вызывает раздражение глаз. Использовать перчатки.' },
  { id: 'lactic_acid', name: 'Молочная кислота', type: 'active', description: 'Альфа-гидроксикислота (AHA), отшелушивание.', safety: 'Может вызывать покраснение при высокой концентрации.' },
  { id: 'salicylic_acid', name: 'Салициловая кислота', type: 'active', description: 'BHA-кислота, антибактериальное, отшелушивание.', safety: 'Не использовать при беременности. Сушит кожу.' },
  { id: 'baking_soda', name: 'Гидрокарбонат натрия (Сода)', type: 'active', description: 'Мягкий абразив, нейтрализатор запахов.', safety: 'Безопасно.' },
  { id: 'sodium_lactate', name: 'Лактат натрия', type: 'active', description: 'Увлажняющий агент, регулятор pH.', safety: 'Безопасно.' },

  // Эфирные масла
  { id: 'essential_oil_lavender', name: 'Эфирное масло лаванды', type: 'fragrance', description: 'Ароматизатор с успокаивающим эффектом.', safety: 'Может вызывать аллергическую реакцию. Не наносить в чистом виде.' },
  { id: 'essential_oil_lemon', name: 'Эфирное масло лимона', type: 'fragrance', description: 'Ароматизатор, антибактериальный эффект.', safety: 'Фототоксично. Избегать солнца после нанесения.' },
  { id: 'essential_oil_tea_tree', name: 'Эфирное масло чайного дерева', type: 'fragrance', description: 'Антисептическое масло с медицинским ароматом.', safety: 'Токсично при приёме внутрь. Разбавлять обязательно.' },
  { id: 'essential_oil_eucalyptus', name: 'Эфирное масло эвкалипта', type: 'fragrance', description: 'Свежий аромат, отхаркивающее действие.', safety: 'Не использовать при астме. Токсично для животных.' },
  { id: 'essential_oil_peppermint', name: 'Эфирное масло мяты', type: 'fragrance', description: 'Освежающий аромат, охлаждающий эффект.', safety: 'Не использовать у детей до 6 лет. Может вызвать раздражение.' },

  // Консерванты
  { id: 'phenoxyethanol', name: 'Феноксиэтанол', type: 'preservative', description: 'Консервант широкого спектра действия.', safety: 'Безопасен в концентрациях до 1%. Избегать попадания в глаза.' },
  { id: 'sodium_benzoate', name: 'Бензоат натрия', type: 'preservative', description: 'Консервант для кислых продуктов.', safety: 'Может образовывать бензол при нагревании с витамином C.' },
  { id: 'potassium_sorbate', name: 'Сорбат калия', type: 'preservative', description: 'Консервант для широкого спектра pH.', safety: 'Безопасен, натурального происхождения.' },
  { id: 'leucidal', name: 'Лейцидал (радика', type: 'preservative', description: 'Натуральный консервант из радиальной статьи.', safety: 'Безопасен, подходит для «чистой» косметики.' },

  // Масла и воски
  { id: 'coconut_oil', name: 'Кокосовое масло', type: 'additive', description: 'Натуральное масло с антибактериальными свойствами.', safety: 'Безопасно, может забивать поры при жирной коже.' },
  { id: 'almond_oil', name: 'Масло сладкого миндаля', type: 'additive', description: 'Лёгкое масло для кожи и волос.', safety: 'Аллергия возможна при ореховой непереносимости.' },
  { id: 'jojoba_oil', name: 'Масло жожоба', type: 'additive', description: 'Технически жидкий воск, близкий к кожному сексу.', safety: 'Очень безопасно.' },
  { id: 'beeswax', name: 'Пчелиный воск', type: 'additive', description: 'Загуститель для кремов и бальзамов.', safety: 'Безопасно.' },
  { id: 'carnauba_wax', name: 'Воск карнаубы', type: 'additive', description: 'Твёрдый воск из пальм, глянец.', safety: 'Безопасно.' },

  // Красители и ароматизаторы
  { id: 'mica', name: 'Слюда (перламутр)', type: 'additive', description: 'Минеральный перламутровый пигмент.', safety: 'Безопасно, может содержать тяжёлые металлы в зависимости от качества.' },
  { id: 'titanium_dioxide', name: 'Диоксид титана', type: 'additive', description: 'Белый пигмент и UV-фильтр.', safety: 'Безопасно, наночастицы требуют проверки.' },
  { id: 'fragrance_blend', name: 'Парфюмерная композиция', type: 'fragrance', description: 'Смесь эфирных масел и синтетических ароматов.', safety: 'Может вызывать аллергию. Тестировать на коже.' },
  { id: 'leucidal', name: 'Лейцидал', type: 'preservative', description: 'Натуральный консервант из радиальной статьи.', safety: 'Безопасен, подходит для «чистой» косметики.' },
  { id: 'sodium_chloride', name: 'Хлорид натрия (соль)', type: 'additive', description: 'Загуститель для гелей, регулятор ионной силы.', safety: 'Безопасно.' },
  { id: 'hydrogen_peroxide', name: 'Перекись водорода', type: 'active', description: 'Антисептик, отбеливатель, окислитель.', safety: 'Раздражает кожу и слизистые. Не использовать концентрированную.' },
  { id: 'rice_starch', name: 'Рисовый крахмал', type: 'additive', description: 'Поглощает влагу и жир, матирует.', safety: 'Безопасно.' },
  { id: 'kaolin_clay', name: 'Каолиновая глина', type: 'additive', description: 'Матирующая глина для кожи.', safety: 'Безопасно, может сушить кожу.' },
  { id: 'coffee_grounds', name: 'Кофейная гуща', type: 'additive', description: 'Натуральный абразив для скрабов.', safety: 'Безопасно при использовании на теле.' },
  { id: 'sugar', name: 'Сахар', type: 'additive', description: 'Мягкий абразив, питательный компонент.', safety: 'Безопасно.' },
  { id: 'essential_oil_coffee', name: 'Ароматизатор «Кофе»', type: 'fragrance', description: 'Ароматическая композиция с кофейными нотами.', safety: 'Проверять на аллергию.' },
  { id: 'rose_water', name: 'Розовая вода', type: 'base', description: 'Гидролат розы, успокаивающий тонер.', safety: 'Безопасно.' },
  { id: 'vitamin_c', name: 'Аскорбиновая кислота (витамин C)', type: 'active', description: 'Антиоксидант, осветляет кожу, стимулирует коллаген.', safety: 'Может вызывать покалывание. Хранить в тёмном месте.' },
  { id: 'calcium_carbonate', name: 'Карбонат кальция', type: 'active', description: 'Мягкий абразив для зубов и кожи.', safety: 'Безопасно.' },
  { id: 'xanthan_gum', name: 'Ксантановая камедь', type: 'additive', description: 'Натуральный загуститель.', safety: 'Безопасно.' },
  { id: 'peppermint_oil', name: 'Эфирное масло мяты', type: 'fragrance', description: 'Освежающий аромат, охлаждающий эффект.', safety: 'Не использовать у детей до 6 лет.' },
  { id: 'stevia', name: 'Стевия', type: 'active', description: 'Натуральный подсластитель.', safety: 'Безопасно.' },
];
