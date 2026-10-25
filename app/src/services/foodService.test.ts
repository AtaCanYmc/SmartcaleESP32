import assert from 'node:assert/strict';
import { calculateNutrition, parseProductRaw, OpenFoodFactsService, getOpenFoodFactsEditUrl } from './foodService';
import type { FoodNutriments } from '../types/food';

// 1. Check nutrition scaling calculation
const sampleNutriments: FoodNutriments = {
  calories100g: 250,
  proteins100g: 10,
  carbs100g: 30,
  fat100g: 8,
  sugars100g: 15,
  salt100g: 0.5,
};

// 200 grams = 2x
const scaled200g = calculateNutrition(sampleNutriments, 200);
assert.equal(scaled200g.calories, 500);
assert.equal(scaled200g.proteins, 20);
assert.equal(scaled200g.carbs, 60);
assert.equal(scaled200g.fat, 16);
assert.equal(scaled200g.sugars, 30);
assert.equal(scaled200g.salt, 1);

// Negative weight should clamp to 0
const scaledNeg = calculateNutrition(sampleNutriments, -50);
assert.equal(scaledNeg.calories, 0);
assert.equal(scaledNeg.proteins, 0);

// 2. Check parsing from Open Food Facts raw response
const rawSample = {
  code: '0737628064502',
  product_name: 'Thai Peanut Noodles',
  brands: 'Thai Kitchen',
  image_url: 'https://example.com/image.jpg',
  nutriments: {
    'energy-kcal_100g': 385,
    proteins_100g: '9.62',
    carbohydrates_100g: 71.15,
    fat_100g: 7.69,
    sugars_100g: 13.46,
    salt_100g: 0.72,
  },
};

const parsed = parseProductRaw(rawSample);
assert.ok(parsed);
if (!parsed) {
  throw new Error('Expected parsed product to be defined');
}
assert.equal(parsed.code, '0737628064502');
assert.equal(parsed.name, 'Thai Peanut Noodles');
assert.equal(parsed.brands, 'Thai Kitchen');
assert.equal(parsed.nutriments.calories100g, 385);
assert.equal(parsed.nutriments.proteins100g, 9.62);
assert.equal(parsed.nutriments.carbs100g, 71.15);
assert.equal(parsed.nutriments.fat100g, 7.69);

// Missing code or name should return null
assert.equal(parseProductRaw({ code: '' }), null);
assert.equal(parseProductRaw({ product_name: 'Empty' }), null);

// Check 2 decimal places precision on calories and macros
const decimalSample = parseProductRaw({
  code: '123',
  product_name: 'Decimal Item',
  nutriments: {
    'energy-kcal_100g': 530.55555,
    proteins_100g: 6.111111,
    carbohydrates_100g: 55.55555,
    fat_100g: 30.55555,
  },
});
assert.ok(decimalSample);
if (!decimalSample) throw new Error('Expected decimalSample to be defined');
assert.equal(decimalSample.nutriments.calories100g, 530.56);
assert.equal(decimalSample.nutriments.proteins100g, 6.11);
assert.equal(decimalSample.nutriments.carbs100g, 55.56);
assert.equal(decimalSample.nutriments.fat100g, 30.56);

// 3. Service instance check
const service = new OpenFoodFactsService();
assert.ok(typeof service.search === 'function');
assert.ok(typeof service.getByBarcode === 'function');
assert.ok(typeof service.uploadProduct === 'function');

// 4. Open Food Facts contribution URL check
const editUrl = getOpenFoodFactsEditUrl('8690504018086');
assert.equal(editUrl, 'https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=8690504018086');

console.log('✓ All foodService tests passed!');
