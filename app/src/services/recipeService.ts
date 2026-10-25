import type { FoodProduct } from '../types/food';
import { calculateNutrition } from './foodService';

export interface RecipeIngredient {
  id: string;
  name: string;
  weightGrams: number;
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
}

export interface RecipeTotals {
  totalWeight: number;
  calories: number;
  proteins: number;
  carbs: number;
  fat: number;
}

export class RecipeService {
  createIngredientFromProduct(product: FoodProduct, weightGrams: number): RecipeIngredient {
    const nutrition = calculateNutrition(product.nutriments, weightGrams);
    return {
      id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: product.name,
      weightGrams,
      calories: nutrition.calories,
      proteins: nutrition.proteins,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
    };
  }

  createManualIngredient(
    name: string,
    weightGrams: number,
    per100g?: { calories?: number; proteins?: number; carbs?: number; fat?: number }
  ): RecipeIngredient {
    const factor = weightGrams / 100;
    return {
      id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Malzeme',
      weightGrams,
      calories: Math.round(((per100g?.calories || 0) * factor) * 10) / 10,
      proteins: Math.round(((per100g?.proteins || 0) * factor) * 10) / 10,
      carbs: Math.round(((per100g?.carbs || 0) * factor) * 10) / 10,
      fat: Math.round(((per100g?.fat || 0) * factor) * 10) / 10,
    };
  }

  calculateTotals(ingredients: RecipeIngredient[]): RecipeTotals {
    return ingredients.reduce(
      (acc, item) => ({
        totalWeight: Math.round((acc.totalWeight + item.weightGrams) * 10) / 10,
        calories: Math.round((acc.calories + item.calories) * 10) / 10,
        proteins: Math.round((acc.proteins + item.proteins) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fat: Math.round((acc.fat + item.fat) * 10) / 10,
      }),
      { totalWeight: 0, calories: 0, proteins: 0, carbs: 0, fat: 0 }
    );
  }

  calculatePerServing(totals: RecipeTotals, servings: number): RecipeTotals {
    const s = Math.max(1, servings);
    return {
      totalWeight: Math.round((totals.totalWeight / s) * 10) / 10,
      calories: Math.round((totals.calories / s) * 10) / 10,
      proteins: Math.round((totals.proteins / s) * 10) / 10,
      carbs: Math.round((totals.carbs / s) * 10) / 10,
      fat: Math.round((totals.fat / s) * 10) / 10,
    };
  }

  generateAiRecipePrompt(title: string, ingredients: RecipeIngredient[], servings: number): string {
    const totals = this.calculateTotals(ingredients);
    const perServing = this.calculatePerServing(totals, servings);

    const ingLines = ingredients
      .map(
        (ing, idx) =>
          `${idx + 1}. ${ing.name}: ${ing.weightGrams}g (${ing.calories} kcal, P:${ing.proteins}g, K:${ing.carbs}g, Y:${ing.fat}g)`
      )
      .join('\n');

    return `Sen uzman bir şef ve beslenme uzmanısın. Akıllı mutfak terazisi (Smartcale ESP32) ile hassas gramajları tartılarak hazırlanan aşağıdaki tarifi analiz etmeni rica ediyorum:

TARİF: ${title || 'Özel Karışım'}
Toplam Gramaj: ${totals.totalWeight}g
Porsiyon Sayısı: ${servings}

KULLANILAN MALZEMELER:
${ingLines}

TOPLAM BESİN DEĞERLERİ:
- Toplam Enerji: ${totals.calories} kcal (Porsiyon Başı: ${perServing.calories} kcal)
- Protein: ${totals.proteins}g (Porsiyon Başı: ${perServing.proteins}g)
- Karbonhidrat: ${totals.carbs}g (Porsiyon Başı: ${perServing.carbs}g)
- Yağ: ${totals.fat}g (Porsiyon Başı: ${perServing.fat}g)

LÜTFEN ŞU KONULARDA YORUM VE TAVSİYEDE BULUN:
1. Hazırlama ve Pişirme Önerileri: Malzemelerin birbiriyle uyumu, ideal pişirme derecesi/süresi.
2. Besin Değeri Değerlendirmesi: Makro dengesi, tokluk hissi ve glisemik yük.
3. Sağlıklı Alternatifler: Tarifin besin profilini daha da güçlendirmek için eklenebilecek veya azaltılabilecek malzemeler.`;
  }
}

export const recipeService = new RecipeService();
