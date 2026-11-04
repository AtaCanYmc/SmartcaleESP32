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

function parseNum(val: unknown): number {
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

export interface CustomFoodApiConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey?: string;
}

const CUSTOM_API_STORAGE_KEY = 'smartcale_custom_food_api';

export function getCustomApiConfig(): CustomFoodApiConfig {
  if (typeof localStorage === 'undefined') {
    return { enabled: false, apiUrl: '', apiKey: '' };
  }
  try {
    const raw = localStorage.getItem(CUSTOM_API_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        apiUrl: typeof parsed.apiUrl === 'string' ? parsed.apiUrl : '',
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      };
    }
  } catch {}
  return { enabled: false, apiUrl: '', apiKey: '' };
}

export function saveCustomApiConfig(cfg: CustomFoodApiConfig): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_API_STORAGE_KEY, JSON.stringify({
      enabled: Boolean(cfg.enabled),
      apiUrl: cfg.apiUrl.trim(),
      apiKey: cfg.apiKey?.trim() || '',
    }));
  } catch {}
}

export function parseCustomProductRaw(raw: unknown): FoodProduct | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const code = String(obj.code ?? obj.id ?? obj.barcode ?? '').trim();
  const name = String(obj.name ?? obj.product_name ?? obj.title ?? '').trim();
  if (!code && !name) return null;

  const brands = obj.brands ?? obj.brand;
  let brandStr: string | undefined;
  if (Array.isArray(brands)) {
    brandStr = brands.filter(Boolean).join(', ').trim() || undefined;
  } else if (typeof brands === 'string') {
    brandStr = brands.trim() || undefined;
  }

  const imageUrl = typeof (obj.imageUrl ?? obj.image_url) === 'string'
    ? String(obj.imageUrl ?? obj.image_url).trim()
    : undefined;

  const n = (typeof obj.nutriments === 'object' && obj.nutriments !== null ? obj.nutriments : {}) as Record<string, unknown>;

  const calories = parseNum(
    obj.calories100g ?? obj.calories ?? obj.kcal ?? n.calories100g ?? n['energy-kcal_100g'] ?? n['energy-kcal'] ?? n['energy-kcal_value']
  );
  const proteins = parseNum(
    obj.proteins100g ?? obj.protein ?? obj.proteins ?? n.proteins100g ?? n.proteins
  );
  const carbs = parseNum(
    obj.carbs100g ?? obj.carbohydrates ?? obj.carbs ?? n.carbs100g ?? n.carbohydrates_100g ?? n.carbohydrates
  );
  const fat = parseNum(
    obj.fat100g ?? obj.fat ?? n.fat100g ?? n.fat
  );
  const sugars = obj.sugars100g ?? obj.sugars ?? n.sugars100g ?? n.sugars;
  const salt = obj.salt100g ?? obj.salt ?? n.salt100g ?? n.salt;

  return {
    code: code || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    brands: brandStr,
    imageUrl: imageUrl || undefined,
    nutriments: {
      calories100g: Math.round(calories * 100) / 100,
      proteins100g: Math.round(proteins * 100) / 100,
      carbs100g: Math.round(carbs * 100) / 100,
      fat100g: Math.round(fat * 100) / 100,
      sugars100g: sugars !== undefined ? Math.round(parseNum(sugars) * 100) / 100 : undefined,
      salt100g: salt !== undefined ? Math.round(parseNum(salt) * 100) / 100 : undefined,
    },
  };
}

async function fetchCustomJson(url: string, apiKey?: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (apiKey?.trim()) {
    headers['Authorization'] = apiKey.trim().startsWith('Bearer ')
      ? apiKey.trim()
      : `Bearer ${apiKey.trim()}`;
    headers['X-API-Key'] = apiKey.trim();
  }

  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url,
      headers,
      connectTimeout: 4000,
      readTimeout: 4000,
    });
    if (res.status >= 400) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function testCustomApi(cfg: CustomFoodApiConfig): Promise<{ success: boolean; message: string; sampleCount?: number }> {
  const base = cfg.apiUrl.trim().replace(/\/+$/, '');
  if (!base) {
    return { success: false, message: 'URL cannot be empty' };
  }
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    return { success: false, message: 'URL must start with http:// or https://' };
  }

  const sep = base.includes('?') ? '&' : '?';
  const testUrl = `${base}${sep}q=test&limit=3`;

  try {
    const data = await fetchCustomJson(testUrl, cfg.apiKey);
    const items = Array.isArray(data)
      ? data
      : Array.isArray((data as Record<string, unknown>)?.items)
      ? (data as Record<string, unknown>).items as unknown[]
      : Array.isArray((data as Record<string, unknown>)?.products)
      ? (data as Record<string, unknown>).products as unknown[]
      : Array.isArray((data as Record<string, unknown>)?.data)
      ? (data as Record<string, unknown>).data as unknown[]
      : Array.isArray((data as Record<string, unknown>)?.results)
      ? (data as Record<string, unknown>).results as unknown[]
      : [];

    return {
      success: true,
      message: 'OK',
      sampleCount: items.length,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

export class HybridFoodService implements IFoodService {
  private offService: OpenFoodFactsService;

  constructor(offService = new OpenFoodFactsService()) {
    this.offService = offService;
  }

  async search(query: string, limit = 10): Promise<FoodProduct[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const cfg = getCustomApiConfig();
    if (!cfg.enabled || !cfg.apiUrl.trim()) {
      return this.offService.search(trimmed, limit);
    }

    // Hybrid search: query Custom API & Open Food Facts in parallel
    const customPromise = this.searchCustom(cfg, trimmed, limit);
    const offPromise = this.offService.search(trimmed, limit).catch(() => []);

    const [customResults, offResults] = await Promise.all([customPromise, offPromise]);

    // Merge results with Custom API prioritized, deduplicating by code
    const seenCodes = new Set<string>();
    const merged: FoodProduct[] = [];

    for (const p of customResults) {
      if (p.code && !seenCodes.has(p.code)) {
        seenCodes.add(p.code);
        merged.push(p);
      }
    }
    for (const p of offResults) {
      if (p.code && !seenCodes.has(p.code)) {
        seenCodes.add(p.code);
        merged.push(p);
      }
    }

    return merged.slice(0, limit);
  }

  async getByBarcode(barcode: string): Promise<FoodProduct | null> {
    const trimmed = barcode.trim();
    if (!trimmed) return null;

    const cfg = getCustomApiConfig();
    if (cfg.enabled && cfg.apiUrl.trim()) {
      try {
        const customProduct = await this.getByBarcodeCustom(cfg, trimmed);
        if (customProduct) return customProduct;
      } catch (err) {
        console.warn('Custom API barcode lookup failed, falling back to Open Food Facts:', err);
      }
    }

    return this.offService.getByBarcode(trimmed);
  }

  async uploadProduct(data: OpenFoodFactsWriteData): Promise<{ success: boolean; statusVerbose: string }> {
    return this.offService.uploadProduct(data);
  }

  private async searchCustom(cfg: CustomFoodApiConfig, query: string, limit: number): Promise<FoodProduct[]> {
    try {
      const base = cfg.apiUrl.trim().replace(/\/+$/, '');
      const sep = base.includes('?') ? '&' : '?';
      const url = `${base}${sep}q=${encodeURIComponent(query)}&limit=${limit}`;
      const data = await fetchCustomJson(url, cfg.apiKey);
      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>)?.items)
        ? (data as Record<string, unknown>).items as unknown[]
        : Array.isArray((data as Record<string, unknown>)?.products)
        ? (data as Record<string, unknown>).products as unknown[]
        : Array.isArray((data as Record<string, unknown>)?.data)
        ? (data as Record<string, unknown>).data as unknown[]
        : Array.isArray((data as Record<string, unknown>)?.results)
        ? (data as Record<string, unknown>).results as unknown[]
        : [];

      return items
        .map(parseCustomProductRaw)
        .filter((p): p is FoodProduct => p !== null);
    } catch (err) {
      console.warn('Custom API search failed, falling back to Open Food Facts:', err);
      return [];
    }
  }

  private async getByBarcodeCustom(cfg: CustomFoodApiConfig, barcode: string): Promise<FoodProduct | null> {
    const base = cfg.apiUrl.trim().replace(/\/+$/, '');
    const url = `${base}/${encodeURIComponent(barcode)}`;
    const data = await fetchCustomJson(url, cfg.apiKey);
    if (!data) return null;
    const raw = (data as Record<string, unknown>)?.product ?? (data as Record<string, unknown>)?.data ?? data;
    return parseCustomProductRaw(raw);
  }
}

export const foodService: IFoodService = new HybridFoodService();
