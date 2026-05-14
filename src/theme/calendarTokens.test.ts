import { describe, it, expect } from 'vitest';

import {
  isCalendarLayout,
  isDensityName,
  isAccentIntensityName,
  CALENDAR_LAYOUTS,
  DENSITIES,
  ACCENT_INTENSITIES,
  CALENDAR_SETTING_KEYS,
} from './calendarTokens';

describe('calendarTokens', () => {
  describe('isCalendarLayout', () => {
    it('accepts the three known layouts', () => {
      for (const v of ['grid', 'tidemark', 'constellation']) {
        expect(isCalendarLayout(v)).toBe(true);
      }
    });

    it('rejects anything else', () => {
      expect(isCalendarLayout('weekly')).toBe(false);
      expect(isCalendarLayout('')).toBe(false);
      expect(isCalendarLayout('GRID')).toBe(false);
    });
  });

  describe('isDensityName', () => {
    it('accepts compact / standard / roomy', () => {
      expect(isDensityName('compact')).toBe(true);
      expect(isDensityName('standard')).toBe(true);
      expect(isDensityName('roomy')).toBe(true);
    });

    it('rejects anything else', () => {
      expect(isDensityName('tight')).toBe(false);
      expect(isDensityName('large')).toBe(false);
      expect(isDensityName('')).toBe(false);
    });
  });

  describe('isAccentIntensityName', () => {
    it('accepts whisper / standard / signal', () => {
      expect(isAccentIntensityName('whisper')).toBe(true);
      expect(isAccentIntensityName('standard')).toBe(true);
      expect(isAccentIntensityName('signal')).toBe(true);
    });

    it('rejects anything else', () => {
      expect(isAccentIntensityName('loud')).toBe(false);
      expect(isAccentIntensityName('')).toBe(false);
    });
  });

  describe('DENSITIES', () => {
    it('cell size grows compact → standard → roomy', () => {
      expect(DENSITIES.compact.cellSize).toBeLessThan(DENSITIES.standard.cellSize);
      expect(DENSITIES.standard.cellSize).toBeLessThan(DENSITIES.roomy.cellSize);
    });

    it('FAB size grows compact → roomy and meets 56pt minimum (WCAG)', () => {
      expect(DENSITIES.compact.fabSize).toBeGreaterThanOrEqual(56);
      expect(DENSITIES.compact.fabSize).toBeLessThan(DENSITIES.roomy.fabSize);
    });

    it('typeScale at standard is exactly 1', () => {
      expect(DENSITIES.standard.typeScale).toBe(1);
    });
  });

  describe('ACCENT_INTENSITIES', () => {
    it('opacity grows whisper → standard → signal', () => {
      expect(ACCENT_INTENSITIES.whisper.opacity).toBeLessThan(ACCENT_INTENSITIES.standard.opacity);
      expect(ACCENT_INTENSITIES.standard.opacity).toBeLessThan(ACCENT_INTENSITIES.signal.opacity);
    });

    it('signal opacity caps at 1', () => {
      expect(ACCENT_INTENSITIES.signal.opacity).toBe(1);
    });

    it('all opacities are within (0, 1]', () => {
      for (const k of Object.keys(ACCENT_INTENSITIES) as (keyof typeof ACCENT_INTENSITIES)[]) {
        const o = ACCENT_INTENSITIES[k].opacity;
        expect(o).toBeGreaterThan(0);
        expect(o).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('CALENDAR_LAYOUTS', () => {
    it('contains exactly the three documented layouts', () => {
      expect([...CALENDAR_LAYOUTS].sort()).toEqual(['constellation', 'grid', 'tidemark']);
    });
  });

  describe('CALENDAR_SETTING_KEYS', () => {
    it('settings keys are namespaced under calendar.', () => {
      for (const k of Object.values(CALENDAR_SETTING_KEYS)) {
        expect(k.startsWith('calendar.')).toBe(true);
      }
    });
  });
});
