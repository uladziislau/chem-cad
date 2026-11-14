/** Запросы по коллекции рецептов без привязки к сервисам. */

/** Рецепты, в составе которых есть ингредиент с данным id. */
export function recipesUsingIngredient<T extends { ingredients: { ingredientId: string }[] }>(
  recipes: T[],
  ingredientId: string,
): T[] {
  return recipes.filter(r => r.ingredients.some(i => i.ingredientId === ingredientId));
}
