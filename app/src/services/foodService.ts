import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { FoodProduct, FoodNutriments, ScaledNutrition } from '../types/food';

export interface OpenFoodFactsWriteData {
  code: string;
  name: string;
  brand?: string;
  calories100g: number;
  proteins100g: number;
  carbs100g: number;
  fat100g: number;
}

export function getOpenFoodFactsEditUrl(barcode: string): string {
  return `https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=${encodeURIComponent(barcode.trim())}`;
}

export interface IFoodService {
  search(query: string, limit?: number): Promise<FoodProduct[]>;
  getByBarcode(barcode: string): Promise<FoodProduct | null>;
  uploadProduct(data: OpenFoodFactsWriteData): Promise<{ success: boolean; statusVerbose: string }>;
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
  const rawCalories = parseNum(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? n['energy-kcal_value']);
  const calories = Math.round(rawCalories * 100) / 100;
  const proteins = Math.round(parseNum(n.proteins_100g ?? n.proteins) * 100) / 100;
  const carbs = Math.round(parseNum(n.carbohydrates_100g ?? n.carbohydrates) * 100) / 100;
  const fat = Math.round(parseNum(n.fat_100g ?? n.fat) * 100) / 100;
  const sugars = n.sugars_100g !== undefined ? Math.round(parseNum(n.sugars_100g) * 100) / 100 : undefined;
  const salt = n.salt_100g !== undefined ? Math.round(parseNum(n.salt_100g) * 100) / 100 : undefined;

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

  async uploadProduct(data: OpenFoodFactsWriteData): Promise<{ success: boolean; statusVerbose: string }> {
    const code = data.code.trim();
    const name = data.name.trim();
    if (!code || !name) {
      return { success: false, statusVerbose: 'Missing code or product name' };
    }

    const targetUrl = 'https://world.openfoodfacts.org/cgi/product_jqm.pl';
    const proxyPath = '/api/off-write';

    const formData = new FormData();
    formData.append('code', code);
    formData.append('product_name', name);
    if (data.brand?.trim()) formData.append('brands', data.brand.trim());
    formData.append('nutriment_energy-kcal_100g', String(data.calories100g));
    formData.append('nutriment_proteins_100g', String(data.proteins100g));
    formData.append('nutriment_carbohydrates_100g', String(data.carbs100g));
    formData.append('nutriment_fat_100g', String(data.fat100g));
    formData.append('comment', 'Added via Smartcale ESP32 Companion');

    try {
      if (Capacitor.isNativePlatform()) {
        const payload: Record<string, string> = {
          code,
          product_name: name,
          'nutriment_energy-kcal_100g': String(data.calories100g),
          'nutriment_proteins_100g': String(data.proteins100g),
          'nutriment_carbohydrates_100g': String(data.carbs100g),
          'nutriment_fat_100g': String(data.fat100g),
          comment: 'Added via Smartcale ESP32 Companion',
        };
        if (data.brand?.trim()) payload.brands = data.brand.trim();

        const res = await CapacitorHttp.post({
          url: targetUrl,
          headers: {
            'User-Agent': USER_AGENT,
          },
          data: payload,
        });

        const success = res.data?.status === 1 || res.status === 200;
        return {
          success,
          statusVerbose: res.data?.status_verbose || (success ? 'Saved to Open Food Facts' : 'Upload failed'),
        };
      }

      const isDev = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
      const urlToFetch = isDev ? proxyPath : targetUrl;

      const res = await fetch(urlToFetch, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json().catch(() => null);
      const success = json?.status === 1 || res.ok;
      return {
        success,
        statusVerbose: json?.status_verbose || (success ? 'Saved to Open Food Facts' : 'Upload failed'),
      };
    } catch (err) {
      console.error('Open Food Facts upload error:', err);
      return {
        success: false,
        statusVerbose: err instanceof Error ? err.message : 'Network error',
      };
    }
  }
}

export function calculateNutrition(nutriments: FoodNutriments, weightGrams: number): ScaledNutrition {
  const factor = Math.max(0, weightGrams) / 100;
  return {
    weightGrams: Math.max(0, weightGrams),
    calories: Math.round(nutriments.calories100g * factor * 100) / 100,
    proteins: Math.round(nutriments.proteins100g * factor * 100) / 100,
    carbs: Math.round(nutriments.carbs100g * factor * 100) / 100,
    fat: Math.round(nutriments.fat100g * factor * 100) / 100,
    sugars: nutriments.sugars100g !== undefined
      ? Math.round(nutriments.sugars100g * factor * 100) / 100
      : undefined,
    salt: nutriments.salt100g !== undefined
      ? Math.round(nutriments.salt100g * factor * 100) / 100
      : undefined,
  };
}

export const foodService: IFoodService = new OpenFoodFactsService();
