import { format, formatISO } from 'date-fns';

/**
 * Formats a duration in minutes as a human-readable string.
 * Examples: "2h 14m", "45m", "1h"
 */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formats a Date as a human-readable date string.
 * Calendar week starts on Sunday (weekStartsOn: 0).
 */
export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

/**
 * Formats a Date as a human-readable time string (12-hour clock with am/pm).
 */
export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Formats a Date as an ISO date string (YYYY-MM-DD), local timezone.
 */
export function formatISODate(date: Date): string {
  return formatISO(date, { representation: 'date' });
}
