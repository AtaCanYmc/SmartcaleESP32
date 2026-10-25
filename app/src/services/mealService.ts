import type { MealEntry, DayNutritionSummary } from '../types/meal';

const STORAGE_KEY = 'smartcale_meal_entries';

export function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export const mealService = {
  getAll(): MealEntry[] {
    const storage = getStorage();
    if (!storage) return [];
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getByDate(dateStr: string): MealEntry[] {
    return this.getAll().filter((entry) => entry.date === dateStr);
  },

  add(entry: Omit<MealEntry, 'id' | 'timestamp'>): MealEntry {
    const all = this.getAll();
    const newEntry: MealEntry = {
      ...entry,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      calories: Number(entry.calories.toFixed(2)),
      proteins: Number(entry.proteins.toFixed(2)),
      carbs: Number(entry.carbs.toFixed(2)),
      fat: Number(entry.fat.toFixed(2)),
      weightGrams: Number(entry.weightGrams.toFixed(2)),
    };

    all.push(newEntry);
    const storage = getStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
    return newEntry;
  },

  delete(id: string): void {
    const filtered = this.getAll().filter((entry) => entry.id !== id);
    const storage = getStorage();
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  calculateDaySummary(entries: MealEntry[]): DayNutritionSummary {
    const summary = entries.reduce<DayNutritionSummary>(
      (acc, curr) => ({
        calories: acc.calories + (curr.calories || 0),
        proteins: acc.proteins + (curr.proteins || 0),
        carbs: acc.carbs + (curr.carbs || 0),
        fat: acc.fat + (curr.fat || 0),
      }),
      { calories: 0, proteins: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: Number(summary.calories.toFixed(2)),
      proteins: Number(summary.proteins.toFixed(2)),
      carbs: Number(summary.carbs.toFixed(2)),
      fat: Number(summary.fat.toFixed(2)),
    };
  },

  getLoggedDates(): string[] {
    const dates = new Set<string>();
    for (const entry of this.getAll()) {
      dates.add(entry.date);
    }
    return Array.from(dates).sort();
  },

  exportAsJSON(): string {
    const all = this.getAll();
    return JSON.stringify(all, null, 2);
  },

  exportAsCSV(): string {
    const all = this.getAll();
    const headers = ['Date', 'Time', 'Meal', 'Food Name', 'Brand', 'Weight (g)', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
    const rows = all.map((e) => {
      const timeStr = new Date(e.timestamp).toLocaleTimeString();
      const escape = (val: string | number | undefined) => {
        const s = String(val ?? '').replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
      };
      return [
        escape(e.date),
        escape(timeStr),
        escape(e.mealType),
        escape(e.foodName),
        escape(e.brand || ''),
        escape(e.weightGrams),
        escape(e.calories),
        escape(e.proteins),
        escape(e.carbs),
        escape(e.fat),
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  },

  clearAll(): void {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }
  },
};

export function downloadFile(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined' || !window.document) return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
