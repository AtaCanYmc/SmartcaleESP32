import assert from 'node:assert/strict';
import { mealService, getLocalDateString, generateAiPrompt } from './mealService';

// Mock localStorage for Node test environment
const storage = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, val: string) => {
      storage.set(key, val);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
};

// 1. Test getLocalDateString
const fixedDate = new Date(2026, 9, 25); // month 9 is October in JS
assert.equal(getLocalDateString(fixedDate), '2026-10-25');

// Padding check for single-digit month and day (March 5)
const singleDigitDate = new Date(2026, 2, 5);
assert.equal(getLocalDateString(singleDigitDate), '2026-03-05');

// 2. Test mealService CRUD
mealService.clearAll();
assert.equal(mealService.getAll().length, 0);

// Add entry
const entry1 = mealService.add({
  date: '2026-10-25',
  mealType: 'breakfast',
  foodName: 'Oatmeal with Honey',
  brand: 'Generic',
  weightGrams: 150.45,
  calories: 220.12,
  proteins: 7.55,
  carbs: 40.11,
  fat: 3.22,
});

assert.ok(entry1.id);
assert.equal(entry1.weightGrams, 150.45);
assert.equal(entry1.calories, 220.12);
assert.equal(entry1.proteins, 7.55);
assert.equal(entry1.carbs, 40.11);
assert.equal(entry1.fat, 3.22);
assert.equal(entry1.date, '2026-10-25');

// Add entry with special characters for CSV escaping test
mealService.add({
  date: '2026-10-25',
  mealType: 'lunch',
  foodName: 'Grilled "Smoky" Chicken, Salad',
  brand: 'Chef\'s "Special"',
  weightGrams: 200,
  calories: 330,
  proteins: 62,
  carbs: 0,
  fat: 7.2,
});

// Add entry for another day
mealService.add({
  date: '2026-10-26',
  mealType: 'dinner',
  foodName: 'Salmon Salad',
  weightGrams: 250,
  calories: 400,
  proteins: 35,
  carbs: 10,
  fat: 22,
});

// 3. Test getByDate
const oct25Entries = mealService.getByDate('2026-10-25');
assert.equal(oct25Entries.length, 2);

const oct26Entries = mealService.getByDate('2026-10-26');
assert.equal(oct26Entries.length, 1);

const emptyEntries = mealService.getByDate('2026-01-01');
assert.equal(emptyEntries.length, 0);

// 4. Test calculateDaySummary
const summary = mealService.calculateDaySummary(oct25Entries);
assert.equal(summary.calories, 550.12);
assert.equal(summary.proteins, 69.55);
assert.equal(summary.carbs, 40.11);
assert.equal(summary.fat, 10.42);

// Summary of empty array returns zeros
const emptySummary = mealService.calculateDaySummary([]);
assert.equal(emptySummary.calories, 0);
assert.equal(emptySummary.proteins, 0);
assert.equal(emptySummary.carbs, 0);
assert.equal(emptySummary.fat, 0);

// 5. Test getLoggedDates
const loggedDates = mealService.getLoggedDates();
assert.deepEqual(loggedDates, ['2026-10-25', '2026-10-26']);

// 6. Test delete
mealService.delete(entry1.id);
assert.equal(mealService.getByDate('2026-10-25').length, 1);
assert.equal(mealService.getAll().length, 2);

// Deleting non-existent id should not crash
mealService.delete('non-existent-id');
assert.equal(mealService.getAll().length, 2);

// 7. Test exportAsJSON
const jsonStr = mealService.exportAsJSON();
const parsedJson = JSON.parse(jsonStr);
assert.equal(Array.isArray(parsedJson), true);
assert.equal(parsedJson.length, 2);

// 8. Test exportAsCSV
const csvStr = mealService.exportAsCSV();
assert.ok(csvStr.includes('Date,Time,Meal,Food Name,Brand,Weight (g),Calories (kcal),Protein (g),Carbs (g),Fat (g)'));
// Escaped quotes: "Grilled ""Smoky"" Chicken, Salad"
assert.ok(csvStr.includes('"Grilled ""Smoky"" Chicken, Salad"'));
assert.ok(csvStr.includes('"Chef\'s ""Special"""'));

// 9. Test generateAiPrompt
const promptStr = generateAiPrompt('2026-10-25', oct25Entries);
assert.ok(promptStr.includes('Smartcale ESP32 - Günlük Beslenme Raporu (2026-10-25)'));
assert.ok(promptStr.includes('Kalori:'));
assert.ok(promptStr.includes('Protein:'));
assert.ok(promptStr.includes('AI Beslenme Analizi ve Yorumu Talebi:'));
assert.ok(promptStr.includes('Grilled "Smoky" Chicken, Salad'));

console.log('✓ All mealService tests passed!');
