export interface FoodNutriments {
  calories100g: number;
  proteins100g: number;
  carbs100g: number;
  fat100g: number;
  sugars100g?: number;
  fiber100g?: number;
  salt100g?: number;
}

export interface FoodProduct {
  code: string;
  name: string;
  brands?: string;
  imageUrl?: string;
  nutriments: FoodNutriments;
}

export interface ScaledNutrition {
  weightGrams: number;
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
  sugars?: number;
  salt?: number;
}
