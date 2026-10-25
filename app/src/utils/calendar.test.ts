import assert from 'node:assert/strict';
import { getCalendarGrid, WEEKDAY_NAMES_BY_LANG } from './calendar';
import type { Language } from '../i18n';

// 1. Weekday names parity across all supported languages
const supportedLangs: Language[] = ['tr', 'en', 'de', 'fr', 'es', 'zh', 'ja', 'ru'];
for (const lang of supportedLangs) {
  const days = WEEKDAY_NAMES_BY_LANG[lang];
  assert.equal(days.length, 7, `${lang} should have exactly 7 weekday abbreviations`);
  for (const day of days) {
    assert.ok(day.length > 0, `${lang} weekday name should not be empty`);
  }
}
assert.deepEqual(WEEKDAY_NAMES_BY_LANG.tr, ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']);
assert.deepEqual(WEEKDAY_NAMES_BY_LANG.en, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
assert.deepEqual(WEEKDAY_NAMES_BY_LANG.zh, ['一', '二', '三', '四', '五', '六', '日']);
assert.deepEqual(WEEKDAY_NAMES_BY_LANG.ja, ['月', '火', '水', '木', '金', '土', '日']);
assert.deepEqual(WEEKDAY_NAMES_BY_LANG.ru, ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);

// 2. Leap year February tests
// Feb 2024 (Leap year -> 29 days)
const feb2024 = new Date(2024, 1, 15);
const feb2024Grid = getCalendarGrid(feb2024, '2024-02-15', new Set());
const feb2024CurrentDays = feb2024Grid.filter((d) => d.isCurrentMonth);
assert.equal(feb2024CurrentDays.length, 29, 'Feb 2024 should have 29 days');
assert.equal(feb2024Grid.length % 7, 0, 'Grid should be full complete weeks');

// Feb 2025 (Non-leap year -> 28 days)
const feb2025 = new Date(2025, 1, 15);
const feb2025Grid = getCalendarGrid(feb2025, '2025-02-15', new Set());
const feb2025CurrentDays = feb2025Grid.filter((d) => d.isCurrentMonth);
assert.equal(feb2025CurrentDays.length, 28, 'Feb 2025 should have 28 days');
assert.equal(feb2025Grid.length % 7, 0, 'Grid should be full complete weeks');

// 3. October 2026 grid alignment
// Oct 1, 2026 was a Thursday. Monday-start means 3 padding days from Sep (Mon, Tue, Wed).
const oct2026 = new Date(2026, 9, 1);
const loggedDates = new Set(['2026-10-10', '2026-10-25']);
const oct2026Grid = getCalendarGrid(oct2026, '2026-10-25', loggedDates);

const octDays = oct2026Grid.filter((d) => d.isCurrentMonth);
assert.equal(octDays.length, 31, 'October has 31 days');

// First day should be Thursday, meaning 3 prev month days (Sep 28, 29, 30)
const prevDays = oct2026Grid.slice(0, 3);
assert.equal(prevDays.every((d) => !d.isCurrentMonth), true);
assert.equal(prevDays[0].dayNumber, 28);
assert.equal(prevDays[1].dayNumber, 29);
assert.equal(prevDays[2].dayNumber, 30);

// Selected date flag
const selectedDay = oct2026Grid.find((d) => d.dateStr === '2026-10-25');
assert.ok(selectedDay);
if (!selectedDay) throw new Error('selectedDay should be defined');
assert.equal(selectedDay.isSelected, true);
assert.equal(selectedDay.hasLogs, true, '2026-10-25 has logged meals');

const unselectedDay = oct2026Grid.find((d) => d.dateStr === '2026-10-15');
assert.ok(unselectedDay);
if (!unselectedDay) throw new Error('unselectedDay should be defined');
assert.equal(unselectedDay.isSelected, false);
assert.equal(unselectedDay.hasLogs, false);

console.log('✓ All calendar tests passed!');
