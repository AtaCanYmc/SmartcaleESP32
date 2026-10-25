import assert from 'node:assert/strict';
import { recipeService, type RecipeIngredient } from './recipeService';
import type { FoodProduct } from '../types/food';

// 1. Manual ingredient creation
const flour = recipeService.createManualIngredient('Tam Buğday Unu', 200, {
  calories: 340,
  proteins: 13,
  carbs: 71,
  fat: 2.5,
});

assert.equal(flour.name, 'Tam Buğday Unu');
assert.equal(flour.weightGrams, 200);
assert.equal(flour.calories, 680);
assert.equal(flour.proteins, 26);
assert.equal(flour.carbs, 142);
assert.equal(flour.fat, 5);

// 2. Ingredient from OpenFoodFacts FoodProduct
const mockMilk: FoodProduct = {
  code: '12345678',
  name: 'Tam Yağlı Süt',
  brands: 'Pınar',
  nutriments: {
    calories100g: 64,
    proteins100g: 3.2,
    carbs100g: 4.8,
    fat100g: 3.6,
  },
};

const milkIngredient = recipeService.createIngredientFromProduct(mockMilk, 250);
assert.equal(milkIngredient.name, 'Tam Yağlı Süt');
assert.equal(milkIngredient.weightGrams, 250);
assert.equal(milkIngredient.calories, 160); // 64 * 2.5
assert.equal(milkIngredient.proteins, 8);   // 3.2 * 2.5
assert.equal(milkIngredient.carbs, 12);    // 4.8 * 2.5
assert.equal(milkIngredient.fat, 9);       // 3.6 * 2.5

// 3. Calculate Totals
const ingredients: RecipeIngredient[] = [flour, milkIngredient];
const totals = recipeService.calculateTotals(ingredients);

assert.equal(totals.totalWeight, 450, 'Total weight must be 200 + 250 = 450g');
assert.equal(totals.calories, 840, 'Total calories: 680 + 160 = 840');
assert.equal(totals.proteins, 34, 'Total proteins: 26 + 8 = 34');
assert.equal(totals.carbs, 154, 'Total carbs: 142 + 12 = 154');
assert.equal(totals.fat, 14, 'Total fat: 5 + 9 = 14');

// 4. Per-serving calculation
const per2Servings = recipeService.calculatePerServing(totals, 2);
assert.equal(per2Servings.totalWeight, 225, '225g per serving');
assert.equal(per2Servings.calories, 420, '420 kcal per serving');
assert.equal(per2Servings.proteins, 17, '17g protein per serving');

// 5. AI Recipe Prompt Generation
const aiPrompt = recipeService.generateAiRecipePrompt('Pankek', ingredients, 2);
assert.ok(aiPrompt.includes('TARİF: Pankek'), 'Must include recipe title');
assert.ok(aiPrompt.includes('Tam Buğday Unu'), 'Must list flour ingredient');
assert.ok(aiPrompt.includes('Tam Yağlı Süt'), 'Must list milk ingredient');
assert.ok(aiPrompt.includes('450g'), 'Must include total weight');
assert.ok(aiPrompt.includes('840 kcal'), 'Must include total calories');
assert.ok(aiPrompt.includes('Porsiyon Sayısı: 2'), 'Must specify servings');

console.log('✓ All recipeService tests passed!');
