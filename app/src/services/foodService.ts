import { Capacitor, CapacitorHttp } from '@capacitor/core';
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

export interface OpenFoodFactsProductRaw {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  image_url?: string;
  image_front_url?: string;
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

  let brands: string | undefined;
  if (Array.isArray(raw.brands)) {
    brands = raw.brands.filter(Boolean).join(', ').trim() || undefined;
  } else if (typeof raw.brands === 'string') {
    brands = raw.brands.trim() || undefined;
  }

  const imageUrl = raw.image_url || raw.image_front_url;

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
    brands,
    imageUrl: imageUrl || undefined,
    nutriments,
  };
}

interface JsonApiResponse {
  status?: number;
  product?: OpenFoodFactsProductRaw;
  hits?: OpenFoodFactsProductRaw[];
  products?: OpenFoodFactsProductRaw[];
}

async function fetchJson(targetUrl: string, proxyPath?: string): Promise<JsonApiResponse> {
  // 1. Native mobile (Capacitor Android / iOS) bypasses browser CORS entirely
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url: targetUrl,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });
    return res.data;
  }

  // 2. Local browser development via Vite proxy to prevent CORS & preflight
  const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  const urlToFetch = isDev && proxyPath ? proxyPath : targetUrl;

  // Never pass custom User-Agent in browser fetch (forbidden header in W3C spec)
  const isBrowser = typeof window !== 'undefined';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (!isBrowser) {
    headers['User-Agent'] = USER_AGENT;
  }

  const res = await fetch(urlToFetch, { headers });
  if (!res.ok) {
    throw new Error(`Open Food Facts API error: ${res.status}`);
  }
  return res.json();
}

export class OpenFoodFactsService implements IFoodService {
  async search(query: string, limit = 10): Promise<FoodProduct[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const params = new URLSearchParams({
      q: trimmed,
      page_size: String(limit),
      fields: 'code,product_name,brands,nutriments,image_url',
    });

    const targetUrl = `https://search.openfoodfacts.org/search?${params.toString()}`;
    const proxyPath = `/api/off-search?${params.toString()}`;

    const data = await fetchJson(targetUrl, proxyPath);
    const items: OpenFoodFactsProductRaw[] = Array.isArray(data?.hits)
      ? data.hits
      : Array.isArray(data?.products)
      ? data.products
      : [];

    return items
      .map(parseProductRaw)
      .filter((p): p is FoodProduct => p !== null);
  }

  async getByBarcode(barcode: string): Promise<FoodProduct | null> {
    const trimmed = barcode.trim();
    if (!trimmed) return null;

    const fields = 'code,product_name,brands,nutriments,image_url';
    const targetUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      trimmed
    )}.json?fields=${fields}`;
    const proxyPath = `/api/off-product/${encodeURIComponent(trimmed)}.json?fields=${fields}`;

    try {
      const data = await fetchJson(targetUrl, proxyPath);
      if (!data || data.status !== 1 || !data.product) {
        return null;
      }
      return parseProductRaw(data.product);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        return null;
      }
      throw err;
    }
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

export const foodService: IFoodService = new OpenFoodFactsService();
