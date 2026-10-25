import type { FoodProduct, FoodNutriments, ScaledNutrition } from '../types/food';

export interface IFoodService {
  search(query: string, limit?: number): Promise<FoodProduct[]>;
  getByBarcode(barcode: string): Promise<FoodProduct | null>;
}

const USER_AGENT = 'SmartcaleESP32 - Web - Version 1.1.0 (https://github.com/AtaCanYmc/SmartcaleESP32)';

interface OpenFoodFactsNutrimentsRaw {
  'energy-kcal_100g'?: number | string;
  'energy-kcal'?: number | string;
  'energy-kcal_value'?: number | string;
  proteins_100g?: number | string;
  proteins?: number | string;
  carbohydrates_100g?: number | string;
  carbohydrates?: number | string;
  fat_100g?: number | string;
  fat?: number | string;
  sugars_100g?: number | string;
  salt_100g?: number | string;
}

interface OpenFoodFactsProductRaw {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutriments?: OpenFoodFactsNutrimentsRaw;
}

function parseNum(val: number | string | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function parseProductRaw(raw: OpenFoodFactsProductRaw): FoodProduct | null {
  const code = raw.code?.trim();
  const name = raw.product_name?.trim();
  if (!code || !name) return null;

  const n = raw.nutriments || {};
  const calories = parseNum(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? n['energy-kcal_value']);
  const proteins = parseNum(n.proteins_100g ?? n.proteins);
  const carbs = parseNum(n.carbohydrates_100g ?? n.carbohydrates);
  const fat = parseNum(n.fat_100g ?? n.fat);
  const sugars = n.sugars_100g !== undefined ? parseNum(n.sugars_100g) : undefined;
  const salt = n.salt_100g !== undefined ? parseNum(n.salt_100g) : undefined;

  const nutriments: FoodNutriments = {
    calories100g: calories,
    proteins100g: proteins,
    carbs100g: carbs,
    fat100g: fat,
    sugars100g: sugars,
    salt100g: salt,
  };

  return {
    code,
    name,
    brands: raw.brands?.trim() || undefined,
    imageUrl: raw.image_url || undefined,
    nutriments,
  };
}

export class OpenFoodFactsService implements IFoodService {
  private readonly baseUrl = 'https://world.openfoodfacts.org';

  async search(query: string, limit = 10): Promise<FoodProduct[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const url = `${this.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(
      trimmed
    )}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,nutriments,image_url`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Open Food Facts search error: ${res.status}`);
    }

    const data = await res.json();
    const products: OpenFoodFactsProductRaw[] = Array.isArray(data.products) ? data.products : [];

    return products
      .map(parseProductRaw)
      .filter((p): p is FoodProduct => p !== null);
  }

  async getByBarcode(barcode: string): Promise<FoodProduct | null> {
    const trimmed = barcode.trim();
    if (!trimmed) return null;

    const url = `${this.baseUrl}/api/v2/product/${encodeURIComponent(
      trimmed
    )}.json?fields=code,product_name,brands,nutriments,image_url`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Open Food Facts barcode lookup error: ${res.status}`);
    }

    const data = await res.json();
    if (!data || data.status !== 1 || !data.product) {
      return null;
    }

    return parseProductRaw(data.product);
  }
}

export function calculateNutrition(nutriments: FoodNutriments, weightGrams: number): ScaledNutrition {
  const factor = Math.max(0, weightGrams) / 100;
  return {
    weightGrams: Math.max(0, weightGrams),
    calories: Math.round(nutriments.calories100g * factor * 10) / 10,
    proteins: Math.round(nutriments.proteins100g * factor * 10) / 10,
    carbs: Math.round(nutriments.carbs100g * factor * 10) / 10,
    fat: Math.round(nutriments.fat100g * factor * 10) / 10,
    sugars: nutriments.sugars100g !== undefined
      ? Math.round(nutriments.sugars100g * factor * 10) / 10
      : undefined,
    salt: nutriments.salt100g !== undefined
      ? Math.round(nutriments.salt100g * factor * 100) / 100
      : undefined,
  };
}

// Singleton instance providing the application-wide service
export const foodService: IFoodService = new OpenFoodFactsService();
