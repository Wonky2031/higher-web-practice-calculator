import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

export function startOfToday(): Date {
  return startOfDay(new Date());
}

export function daysBetween(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from);
}

export function formatDate(date: Date): string {
  return format(date, 'd MMMM', { locale: ru });
}

export function formatDateFull(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru });
}

export function isToday(date: Date, today: Date = new Date()): boolean {
  return isSameDay(date, today);
}

export function isSameMonthAs(date: Date, other: Date): boolean {
  return isSameMonth(date, other);
}

export function presetDay(from: Date = new Date()): Date {
  return addDays(startOfDay(from), 1);
}

export function presetWeek(from: Date = new Date()): Date {
  return addDays(startOfDay(from), 7);
}

export function presetTwoWeeks(from: Date = new Date()): Date {
  return addDays(startOfDay(from), 14);
}

export function presetMonth(from: Date = new Date()): Date {
  return addMonths(startOfDay(from), 1);
}

export function presetEndOfMonth(from: Date = new Date()): Date {
  return endOfMonth(startOfDay(from));
}

export function pluralize(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) {
    return forms[2];
  }
  if (last > 1 && last < 5) {
    return forms[1];
  }
  if (last === 1) {
    return forms[0];
  }
  return forms[2];
}

export function formatDays(n: number): string {
  return `${n} ${pluralize(n, ['день', 'дня', 'дней'])}`;
}
