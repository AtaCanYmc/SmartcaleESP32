export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD local
  timestamp: number;
  mealType: MealType;
  foodName: string;
  brand?: string;
  weightGrams: number;
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
}

export interface DayNutritionSummary {
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
}
