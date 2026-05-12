import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from 'date-fns';

import type { PaletteTokens } from '@/theme/palettes';

export type DayState = {
  migraine?: {
    peakSeverity: number;
    symptomTags: string[];
  } | null;
  triggerLikely?: boolean;
};

/**
 * Returns the background colour for a calendar day cell.
 * Implements spec §1.2 and tokens §1.
 */
export function dayCellColor(day: DayState, palette: PaletteTokens): string {
  const sev = day.migraine?.peakSeverity;
  if (sev !== undefined && sev !== null) {
    if (sev >= 8) return palette.severitySevere;
    if (sev >= 5) return palette.severityModerate;
    if (sev >= 1) return palette.severityMild;
    // sev === 0: aura-only check (G4)
    if (sev === 0 && day.migraine?.symptomTags.includes('aura')) {
      return palette.accentSecondary;
    }
  }
  if (day.triggerLikely) return 'transparent';
  return palette.bg;
}

/**
 * Returns a 6×7 array of dates for a calendar month grid.
 * Includes pad days from adjacent months so the grid always has 42 cells.
 * Week starts on Sunday (weekStartsOn: 0) per spec.
 *
 * @param yearMonth - "YYYY-MM" string
 */
export function getMonthGrid(yearMonth: string): Date[][] {
  const [year, month] = yearMonth.split('-').map(Number);
  const firstOfMonth = new Date(year!, month! - 1, 1);

  const gridStart = startOfWeek(startOfMonth(firstOfMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Pad to exactly 42 cells (6 rows × 7 cols)
  while (days.length < 42) {
    const last = days[days.length - 1]!;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push(next);
  }

  const grid: Date[][] = [];
  for (let i = 0; i < 6; i++) {
    grid.push(days.slice(i * 7, i * 7 + 7));
  }
  return grid;
}

/** Returns the ISO date string "YYYY-MM-DD" for a Date in local timezone. */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Returns the "YYYY-MM" string for a Date. */
export function toYearMonth(date: Date): string {
  return format(date, 'yyyy-MM');
}
