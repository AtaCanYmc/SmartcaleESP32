import type { Language } from '../i18n';
import { getLocalDateString } from '../services/mealService';

export const WEEKDAY_NAMES_BY_LANG: Record<Language, string[]> = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  zh: ['一', '二', '三', '四', '五', '六', '日'],
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

export interface CalendarDay {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasLogs: boolean;
}

export function getCalendarGrid(
  viewDate: Date,
  selectedDateStr: string,
  loggedDatesSet: Set<string>
): CalendarDay[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = getLocalDateString();

  const firstDay = new Date(year, month, 1);
  const startDayOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = startDayOffset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = getLocalDateString(prevDate);
    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      hasLogs: loggedDatesSet.has(dateStr),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = getLocalDateString(curDate);
    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      hasLogs: loggedDatesSet.has(dateStr),
    });
  }

  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = getLocalDateString(nextDate);
    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      hasLogs: loggedDatesSet.has(dateStr),
    });
  }

  return days;
}
