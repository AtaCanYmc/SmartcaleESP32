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

// 0 grams should yield all 0
const scaled0g = calculateNutrition(sampleNutriments, 0);
assert.equal(scaled0g.calories, 0);
assert.equal(scaled0g.proteins, 0);
assert.equal(scaled0g.carbs, 0);
assert.equal(scaled0g.fat, 0);

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
assert.equal(parseProductRaw({ code: '   ', product_name: 'Spaces' }), null);

// Array of brands should join properly
const multiBrandSample = parseProductRaw({
  code: '869050401',
  product_name: 'Chocolate Bar',
  brands: ['Brand Alpha', 'Brand Beta'],
});
assert.ok(multiBrandSample);
if (!multiBrandSample) throw new Error('multiBrandSample should be defined');
assert.equal(multiBrandSample.brands, 'Brand Alpha, Brand Beta');

// Missing nutriments should default to 0 gracefully
const emptyNutrimentsSample = parseProductRaw({
  code: '999',
  product_name: 'Water',
});
assert.ok(emptyNutrimentsSample);
if (!emptyNutrimentsSample) throw new Error('emptyNutrimentsSample should be defined');
assert.equal(emptyNutrimentsSample.nutriments.calories100g, 0);
assert.equal(emptyNutrimentsSample.nutriments.proteins100g, 0);
assert.equal(emptyNutrimentsSample.nutriments.carbs100g, 0);
assert.equal(emptyNutrimentsSample.nutriments.fat100g, 0);

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

// 3. Service instance check & validation
const service = new OpenFoodFactsService();
assert.ok(typeof service.search === 'function');
assert.ok(typeof service.getByBarcode === 'function');
assert.ok(typeof service.uploadProduct === 'function');

// Validation when uploading missing code or name
const missingUploadRes = await service.uploadProduct({
  code: '',
  name: '',
  calories100g: 0,
  proteins100g: 0,
  carbs100g: 0,
  fat100g: 0,
});
assert.equal(missingUploadRes.success, false);
assert.equal(missingUploadRes.statusVerbose, 'Missing code or product name');

// Mock fetch for uploadProduct successful save
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  return {
    ok: true,
    json: async () => ({ status: 1, status_verbose: 'fields saved' }),
  } as unknown as Response;
};

const uploadSuccessRes = await service.uploadProduct({
  code: '8690504018086',
  name: 'Test Milk',
  brand: 'Pinar',
  calories100g: 62,
  proteins100g: 3.2,
  carbs100g: 4.8,
  fat100g: 3.3,
});
assert.equal(uploadSuccessRes.success, true);
assert.equal(uploadSuccessRes.statusVerbose, 'fields saved');

// Mock fetch for network error
const originalConsoleError = console.error;
console.error = () => {};
globalThis.fetch = async () => {
  throw new Error('Connection refused');
};
const uploadErrRes = await service.uploadProduct({
  code: '8690504018086',
  name: 'Test Milk',
  calories100g: 62,
  proteins100g: 3.2,
  carbs100g: 4.8,
  fat100g: 3.3,
});
console.error = originalConsoleError;
assert.equal(uploadErrRes.success, false);
assert.equal(uploadErrRes.statusVerbose, 'Connection refused');

// Restore original fetch
globalThis.fetch = originalFetch;

// 4. Open Food Facts contribution URL check
const editUrl = getOpenFoodFactsEditUrl('8690504018086');
assert.equal(editUrl, 'https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=8690504018086');

// 5. Custom API Parser and HybridFoodService tests
import {
  parseCustomProductRaw,
  getCustomApiConfig,
  saveCustomApiConfig,
  HybridFoodService,
} from './foodService';

// Test parseCustomProductRaw with flat custom schema
const flatCustom = parseCustomProductRaw({
  code: 'custom-001',
  name: 'Homemade Protein Bar',
  brand: 'Kitchen Lab',
  calories: 220,
  protein: 18.5,
  carbs: 22,
  fat: 6.2,
});
assert.ok(flatCustom);
assert.equal(flatCustom.code, 'custom-001');
assert.equal(flatCustom.name, 'Homemade Protein Bar');
assert.equal(flatCustom.brands, 'Kitchen Lab');
assert.equal(flatCustom.nutriments.calories100g, 220);
assert.equal(flatCustom.nutriments.proteins100g, 18.5);
assert.equal(flatCustom.nutriments.carbs100g, 22);
assert.equal(flatCustom.nutriments.fat100g, 6.2);

// Test parseCustomProductRaw with nested nutriments
const nestedCustom = parseCustomProductRaw({
  code: 'custom-002',
  name: 'Quinoa Bowl',
  nutriments: {
    calories100g: 140,
    proteins100g: 5,
    carbs100g: 25,
    fat100g: 2.5,
  },
});
assert.ok(nestedCustom);
assert.equal(nestedCustom.name, 'Quinoa Bowl');
assert.equal(nestedCustom.nutriments.calories100g, 140);

// Invalid input should return null
assert.equal(parseCustomProductRaw(null), null);
assert.equal(parseCustomProductRaw({}), null);
assert.equal(parseCustomProductRaw({ calories: 100 }), null);

// Test get/save CustomApiConfig in localStorage
saveCustomApiConfig({
  enabled: true,
  apiUrl: 'https://my-api.example.com/foods',
  apiKey: 'secret-token-123',
});
const loadedCfg = getCustomApiConfig();
assert.equal(loadedCfg.enabled, true);
assert.equal(loadedCfg.apiUrl, 'https://my-api.example.com/foods');
assert.equal(loadedCfg.apiKey, 'secret-token-123');

// Clean up config for clean test state
saveCustomApiConfig({ enabled: false, apiUrl: '', apiKey: '' });

// Test HybridFoodService search fallback and merge
class MockOffService extends OpenFoodFactsService {
  override async search(query: string): Promise<any[]> {
    return [
      {
        code: 'off-1',
        name: `OFF ${query}`,
        nutriments: { calories100g: 100, proteins100g: 2, carbs100g: 20, fat100g: 1 },
      },
      {
        code: 'shared-code',
        name: 'OFF Version',
        nutriments: { calories100g: 120, proteins100g: 3, carbs100g: 22, fat100g: 2 },
      },
    ];
  }

  override async getByBarcode(barcode: string): Promise<any> {
    if (barcode === 'off-barcode') {
      return {
        code: 'off-barcode',
        name: 'OFF Product',
        nutriments: { calories100g: 80, proteins100g: 1, carbs100g: 15, fat100g: 0.5 },
      };
    }
    return null;
  }
}

const mockOff = new MockOffService();
const hybridService = new HybridFoodService(mockOff);

// Test search when custom API is disabled -> pure OFF results
const disabledResults = await hybridService.search('Apple');
assert.equal(disabledResults.length, 2);
assert.equal(disabledResults[0].code, 'off-1');

// Test search when custom API is enabled -> merges with priority to custom API
saveCustomApiConfig({
  enabled: true,
  apiUrl: 'https://mock.api/foods',
  apiKey: 'test-key',
});

// Mock fetch to simulate custom API response
const testFetch = globalThis.fetch;
globalThis.fetch = async (url: any) => {
  const urlStr = String(url);
  if (urlStr.includes('barcode-custom')) {
    return {
      ok: true,
      json: async () => ({
        code: 'barcode-custom',
        name: 'Custom Barcode Item',
        calories: 300,
        protein: 15,
        carbs: 40,
        fat: 8,
      }),
    } as unknown as Response;
  }
  return {
    ok: true,
    json: async () => [
      {
        code: 'custom-p1',
        name: 'Custom Protein Shake',
        calories: 180,
        protein: 25,
        carbs: 5,
        fat: 2,
      },
      {
        code: 'shared-code', // same code as OFF version -> custom must take priority!
        name: 'Custom Preferred Version',
        calories: 120,
        protein: 4,
        carbs: 22,
        fat: 2,
      },
    ],
  } as unknown as Response;
};

const hybridResults = await hybridService.search('Shake');
assert.equal(hybridResults.length, 3); // custom-p1, shared-code (custom), off-1 (off). shared-code deduplicated!
assert.equal(hybridResults[0].code, 'custom-p1');
assert.equal(hybridResults[1].code, 'shared-code');
assert.equal(hybridResults[1].name, 'Custom Preferred Version'); // Custom takes precedence!
assert.equal(hybridResults[2].code, 'off-1');

// Test getByBarcode with custom API found
const customFound = await hybridService.getByBarcode('barcode-custom');
assert.ok(customFound);
assert.equal(customFound.name, 'Custom Barcode Item');

// Test getByBarcode falling back to Open Food Facts
const fallbackFound = await hybridService.getByBarcode('off-barcode');
assert.ok(fallbackFound);
assert.equal(fallbackFound.name, 'OFF Product');

// Restore original fetch and clean up
globalThis.fetch = testFetch;
saveCustomApiConfig({ enabled: false, apiUrl: '', apiKey: '' });

console.log('✓ All foodService tests passed!');
