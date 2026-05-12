import { describe, it, expect } from 'vitest';
import { dayCellColor, getMonthGrid } from './utils';
import type { DayState } from './utils';
import type { PaletteTokens } from '@/theme/palettes';

// ---------------------------------------------------------------------------
// Test palette (simplified)
// ---------------------------------------------------------------------------

const palette: PaletteTokens = {
  bg: '#F5EFE6',
  surface: '#FBF7F0',
  surfaceElevated: '#FFFEFB',
  textPrimary: '#3A2E1F',
  textSecondary: '#7A6A52',
  textMuted: '#A89A82',
  textInverse: '#FBF7F0',
  border: '#E5DCCB',
  divider: '#EFE7D7',
  accentPrimary: '#B85C38',
  accentSecondary: '#7A8B6F',
  severitySevere: '#8B2E1F',
  severityModerate: '#C97A4B',
  severityMild: '#E5C29F',
  duringTint: '#1F1810',
};

// ---------------------------------------------------------------------------
// dayCellColor
// ---------------------------------------------------------------------------

describe('dayCellColor', () => {
  it('returns severitySevere for peakSeverity >= 8', () => {
    const day: DayState = { migraine: { peakSeverity: 8, symptomTags: [] } };
    expect(dayCellColor(day, palette)).toBe(palette.severitySevere);

    const day10: DayState = { migraine: { peakSeverity: 10, symptomTags: [] } };
    expect(dayCellColor(day10, palette)).toBe(palette.severitySevere);
  });

  it('returns severityModerate for peakSeverity 5–7', () => {
    for (const sev of [5, 6, 7]) {
      const day: DayState = { migraine: { peakSeverity: sev, symptomTags: [] } };
      expect(dayCellColor(day, palette)).toBe(palette.severityModerate);
    }
  });

  it('returns severityMild for peakSeverity 1–4', () => {
    for (const sev of [1, 2, 3, 4]) {
      const day: DayState = { migraine: { peakSeverity: sev, symptomTags: [] } };
      expect(dayCellColor(day, palette)).toBe(palette.severityMild);
    }
  });

  it('returns accentSecondary for aura-only (severity 0 + aura tag)', () => {
    const day: DayState = { migraine: { peakSeverity: 0, symptomTags: ['aura'] } };
    expect(dayCellColor(day, palette)).toBe(palette.accentSecondary);
  });

  it('returns bg for severity 0 without aura tag (edge case)', () => {
    const day: DayState = { migraine: { peakSeverity: 0, symptomTags: [] } };
    // Severity 0 without aura tag falls through to bg
    expect(dayCellColor(day, palette)).toBe(palette.bg);
  });

  it('returns transparent for trigger-likely day (no migraine)', () => {
    const day: DayState = { triggerLikely: true };
    expect(dayCellColor(day, palette)).toBe('transparent');
  });

  it('returns bg for empty day (no migraine, no trigger)', () => {
    const day: DayState = {};
    expect(dayCellColor(day, palette)).toBe(palette.bg);
  });

  it('migraine takes priority over triggerLikely', () => {
    const day: DayState = {
      migraine: { peakSeverity: 6, symptomTags: [] },
      triggerLikely: true,
    };
    expect(dayCellColor(day, palette)).toBe(palette.severityModerate);
  });
});

// ---------------------------------------------------------------------------
// getMonthGrid
// ---------------------------------------------------------------------------

describe('getMonthGrid', () => {
  it('returns a 6×7 grid (42 cells total)', () => {
    const grid = getMonthGrid('2026-03');
    expect(grid).toHaveLength(6);
    for (const week of grid) {
      expect(week).toHaveLength(7);
    }
  });

  it('March 2026 starts on Sunday March 1 — first cell is March 1', () => {
    // March 1, 2026 is a Sunday
    const grid = getMonthGrid('2026-03');
    expect(grid[0]![0]!.getDate()).toBe(1);
    expect(grid[0]![0]!.getMonth()).toBe(2); // March = month index 2
    expect(grid[0]![0]!.getFullYear()).toBe(2026);
  });

  it('grid starts on a Sunday regardless of month', () => {
    // May 2026: May 1 is a Friday. Grid should start on Sunday April 26
    const grid = getMonthGrid('2026-05');
    expect(grid[0]![0]!.getDay()).toBe(0); // Sunday
  });

  it('February 2026 starts on Sunday Feb 1 — first cell is Feb 1', () => {
    // Feb 1, 2026 is a Sunday
    const grid = getMonthGrid('2026-02');
    expect(grid[0]![0]!.getDate()).toBe(1);
    expect(grid[0]![0]!.getMonth()).toBe(1); // Feb = month index 1
    expect(grid[0]![0]!.getFullYear()).toBe(2026);
  });

  it('includes pad days from adjacent months', () => {
    // June 2026: June 1 is a Monday. Grid starts on Sunday May 31.
    const grid = getMonthGrid('2026-06');
    const firstCell = grid[0]![0]!;
    expect(firstCell.getDay()).toBe(0); // Sunday
    expect(firstCell.getMonth()).toBe(4); // May = month index 4
  });

  it('last row ends on Saturday', () => {
    const grid = getMonthGrid('2026-03');
    const lastRow = grid[5]!;
    const lastCell = lastRow[6]!;
    expect(lastCell.getDay()).toBe(6); // Saturday
  });

  it('contains the first and last day of the month', () => {
    const grid = getMonthGrid('2026-04');
    const allDates = grid.flat();
    const april = allDates.filter((d) => d.getMonth() === 3 && d.getFullYear() === 2026);
    expect(april[0]!.getDate()).toBe(1);
    expect(april[april.length - 1]!.getDate()).toBe(30);
  });
});
