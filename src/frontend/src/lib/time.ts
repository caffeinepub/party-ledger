import type { Time } from '../backend';

export function dateToTime(date: Date): Time {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export function timeToDate(time: Time): Date {
  return new Date(Number(time / BigInt(1_000_000)));
}

export function isSameLocalDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function formatDateTime(time: Time): string {
  const date = timeToDate(time);
  return date.toLocaleString();
}

export function formatDate(time: Time): string {
  const date = timeToDate(time);
  return date.toLocaleDateString();
}

/**
 * Format a Date to a datetime-local input string (YYYY-MM-DDTHH:mm)
 */
export function dateToDatetimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a datetime-local input string (YYYY-MM-DDTHH:mm) to a Date
 * Returns null if the string is invalid
 */
export function datetimeLocalToDate(datetimeLocal: string): Date | null {
  if (!datetimeLocal) return null;
  const date = new Date(datetimeLocal);
  if (isNaN(date.getTime())) return null;
  return date;
}
