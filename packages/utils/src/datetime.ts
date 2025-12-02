import { DateTime } from 'luxon';

/**
 * Unified datetime utilities using Luxon internally
 */

/**
 * Parse a date string or Date object into a Luxon DateTime
 */
export function parseDate(
  date: string | Date | DateTime | number
): DateTime | null {
  if (date instanceof DateTime) {
    return date;
  }

  if (typeof date === 'number') {
    return DateTime.fromMillis(date);
  }

  if (date instanceof Date) {
    return DateTime.fromJSDate(date);
  }

  if (typeof date === 'string') {
    // Try ISO string first
    const iso = DateTime.fromISO(date);
    if (iso.isValid) {
      return iso;
    }

    // Try SQL date format
    const sql = DateTime.fromSQL(date);
    if (sql.isValid) {
      return sql;
    }

    // Fallback to JS Date parsing
    const jsDate = new Date(date);
    if (!isNaN(jsDate.getTime())) {
      return DateTime.fromJSDate(jsDate);
    }
  }

  return null;
}

/**
 * Format a date string into a human-readable relative time
 * Examples: "Today", "Yesterday", "3 days ago", "Jan 15, 2024"
 */
export function formatRelativeDate(dateString: string | Date): string {
  const date = parseDate(dateString);
  if (!date || !date.isValid) {
    return 'Invalid date';
  }

  const now = DateTime.now();
  const diff = now.diff(date, 'days').days;
  const diffDays = Math.abs(Math.round(diff));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleString({
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Format a date to a locale date string
 * @param date - Date string, Date object, or DateTime
 * @param options - Locale options (defaults to en-US format)
 */
export function formatDate(
  date: string | Date | DateTime,
  options?: {
    month?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow';
    day?: 'numeric' | '2-digit';
    year?: 'numeric' | '2-digit';
    locale?: string;
  }
): string {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return 'Invalid date';
  }

  const {
    month = 'short',
    day = 'numeric',
    year = 'numeric',
    locale = 'en-US',
  } = options || {};

  return dt.setLocale(locale).toLocaleString({
    month,
    day,
    year,
  });
}

/**
 * Format a date to a locale date and time string
 * @param date - Date string, Date object, or DateTime
 * @param options - Format options
 */
export function formatDateTime(
  date: string | Date | DateTime,
  options?: {
    month?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow';
    day?: 'numeric' | '2-digit';
    year?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    hour12?: boolean;
    locale?: string;
  }
): string {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return 'Invalid date';
  }

  const {
    month = 'short',
    day = 'numeric',
    year = 'numeric',
    hour = '2-digit',
    minute = '2-digit',
    hour12 = true,
    locale = 'en-US',
  } = options || {};

  return dt.setLocale(locale).toLocaleString({
    month,
    day,
    year,
    hour,
    minute,
    hour12,
  });
}

/**
 * Format a date to time only
 * @param date - Date string, Date object, or DateTime
 * @param options - Format options
 */
export function formatTime(
  date: string | Date | DateTime,
  options?: {
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    hour12?: boolean;
    locale?: string;
  }
): string {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return 'Invalid date';
  }

  const {
    hour = '2-digit',
    minute = '2-digit',
    hour12 = true,
    locale = 'en-US',
  } = options || {};

  return dt.setLocale(locale).toLocaleString({
    hour,
    minute,
    hour12,
  });
}

/**
 * Get the current date/time as a DateTime
 */
export function now(): DateTime {
  return DateTime.now();
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date | DateTime): boolean {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return false;
  }
  return dt.hasSame(DateTime.now(), 'day');
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: string | Date | DateTime): boolean {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return false;
  }
  return dt.hasSame(DateTime.now().minus({ days: 1 }), 'day');
}

/**
 * Get the difference between two dates in days
 */
export function diffInDays(
  date1: string | Date | DateTime,
  date2: string | Date | DateTime
): number {
  const dt1 = parseDate(date1);
  const dt2 = parseDate(date2);

  if (!dt1 || !dt1.isValid || !dt2 || !dt2.isValid) {
    return 0;
  }

  return Math.round(dt2.diff(dt1, 'days').days);
}

/**
 * Convert a DateTime to ISO string
 */
export function toISOString(date: string | Date | DateTime): string {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return '';
  }
  return dt.toISO() || '';
}

/**
 * Convert a DateTime to JS Date
 */
export function toJSDate(date: string | Date | DateTime): Date {
  const dt = parseDate(date);
  if (!dt || !dt.isValid) {
    return new Date();
  }
  return dt.toJSDate();
}
