import type { FoodItem } from './useLogMeal';

export interface SafetyCheckResult {
  safe: boolean;
  conflict?: string;
}

export function checkSafety(
  food: FoodItem,
  allergens: string[] | undefined
): SafetyCheckResult {
  if (!allergens || allergens.length === 0) {
    return { safe: true };
  }

  const foodIngredients = food.ingredients.map(i => i.toLowerCase());
  const userAllergens = allergens.map(a => a.toLowerCase());

  const conflict = userAllergens.find(allergen =>
    foodIngredients.includes(allergen)
  );

  if (conflict) {
    return { safe: false, conflict };
  }

  return { safe: true };
}
