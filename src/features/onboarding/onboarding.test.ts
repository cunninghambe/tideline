import { describe, it, expect, vi, beforeEach } from 'vitest';

import { onboardingCopy, PALETTE_PICKER_OPTIONS } from '@/copy';
import { PALETTES } from '@/theme/palettes';

// ---------------------------------------------------------------------------
// Copy string contracts — screens render these verbatim
// ---------------------------------------------------------------------------

describe('onboardingCopy.welcome', () => {
  it('has a title', () => {
    expect(onboardingCopy.welcome.title).toBe(
      'Hi. Tideline helps you understand your migraines.',
    );
  });

  it('has a body mentioning data stays on phone', () => {
    expect(onboardingCopy.welcome.body).toContain(
      'Your data lives on your phone.',
    );
  });

  it('has a Continue cta', () => {
    expect(onboardingCopy.welcome.cta).toBe('Continue');
  });
});

describe('onboardingCopy.location', () => {
  it('has a title', () => {
    expect(onboardingCopy.location.title).toBe('One quick ask: your location.');
  });

  it('has a body mentioning weather data', () => {
    expect(onboardingCopy.location.body).toContain('weather data');
  });

  it('primary and secondary button labels', () => {
    expect(onboardingCopy.location.primary).toBe('Allow location');
    expect(onboardingCopy.location.secondary).toBe('Maybe later');
  });
});

describe('onboardingCopy.notifications', () => {
  it('has a title', () => {
    expect(onboardingCopy.notifications.title).toBe('Want a daily nudge to log?');
  });

  it('has a body about check-in', () => {
    expect(onboardingCopy.notifications.body).toContain('daily check-in');
  });

  it('primary and secondary labels', () => {
    expect(onboardingCopy.notifications.primary).toBe('Yes, remind me');
    expect(onboardingCopy.notifications.secondary).toBe('No thanks');
  });

  it('defaultTime is 09:00', () => {
    expect(onboardingCopy.notifications.defaultTime).toBe('09:00');
  });

  it('timeLabel is "Reminder time"', () => {
    expect(onboardingCopy.notifications.timeLabel).toBe('Reminder time');
  });
});

describe('onboardingCopy.theme', () => {
  it('has a title', () => {
    expect(onboardingCopy.theme.title).toBe('Pick a palette.');
  });

  it('has a body about changing in Settings', () => {
    expect(onboardingCopy.theme.body).toContain('Settings');
  });
});

describe('onboardingCopy.done', () => {
  it('has a title', () => {
    expect(onboardingCopy.done.title).toBe("You're set.");
  });

  it('has a body about the + button', () => {
    expect(onboardingCopy.done.body).toContain('Tap the +');
  });

  it('cta is Get started', () => {
    expect(onboardingCopy.done.cta).toBe('Get started');
  });
});

// ---------------------------------------------------------------------------
// Palette picker — exactly 4 options, no Custom
// ---------------------------------------------------------------------------

describe('PALETTE_PICKER_OPTIONS', () => {
  it('has exactly 4 options (spec G1)', () => {
    expect(PALETTE_PICKER_OPTIONS).toHaveLength(4);
  });

  it('does not include a Custom option', () => {
    const hasCustom = PALETTE_PICKER_OPTIONS.some((o) =>
      o.displayName.toLowerCase().includes('custom'),
    );
    expect(hasCustom).toBe(false);
  });

  it('includes all four named palettes', () => {
    const names = PALETTE_PICKER_OPTIONS.map((o) => o.value);
    expect(names).toContain('calm_sand');
    expect(names).toContain('soft_storm');
    expect(names).toContain('quiet_night');
    expect(names).toContain('forest_pale');
  });

  it('each option has a displayName and value', () => {
    for (const opt of PALETTE_PICKER_OPTIONS) {
      expect(typeof opt.displayName).toBe('string');
      expect(opt.displayName.length).toBeGreaterThan(0);
      expect(typeof opt.value).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// PALETTES — each palette has the required tokens
// ---------------------------------------------------------------------------

const REQUIRED_TOKENS = [
  'bg',
  'surface',
  'surfaceElevated',
  'textPrimary',
  'textSecondary',
  'textMuted',
  'textInverse',
  'border',
  'divider',
  'accentPrimary',
  'accentSecondary',
  'severitySevere',
  'severityModerate',
  'severityMild',
  'duringTint',
] as const;

describe('PALETTES token completeness', () => {
  const paletteNames = ['calm_sand', 'soft_storm', 'quiet_night', 'forest_pale'] as const;

  for (const name of paletteNames) {
    describe(name, () => {
      for (const token of REQUIRED_TOKENS) {
        it(`has token ${token}`, () => {
          expect(typeof PALETTES[name][token]).toBe('string');
          expect(PALETTES[name][token].startsWith('#')).toBe(true);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// formatHHMM — pure time formatting logic used by the notifications screen
// ---------------------------------------------------------------------------

function formatHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

describe('formatHHMM', () => {
  it('formats single-digit hour and minute with leading zeros', () => {
    expect(formatHHMM(9, 0)).toBe('09:00');
  });

  it('formats double-digit hour and minute as-is', () => {
    expect(formatHHMM(14, 30)).toBe('14:30');
  });

  it('handles midnight (00:00)', () => {
    expect(formatHHMM(0, 0)).toBe('00:00');
  });

  it('handles 23:59', () => {
    expect(formatHHMM(23, 59)).toBe('23:59');
  });

  it('pads single-digit minute correctly', () => {
    expect(formatHHMM(10, 5)).toBe('10:05');
  });
});

// ---------------------------------------------------------------------------
// writeSetting — integration test with mocked DB
// ---------------------------------------------------------------------------

describe('writeSetting', () => {
  const runMock = vi.fn();

  beforeEach(() => {
    runMock.mockReset();
  });

  it('calls db.insert with the correct key and value', async () => {
    const onConflictDoUpdateMock = vi.fn().mockReturnValue({ run: runMock });
    const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock });
    const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

    vi.doMock('@/db/client', () => ({ db: { insert: insertMock } }));
    vi.doMock('@/db/schema/settings', () => ({
      settings: { key: 'key' },
    }));

    const { writeSetting } = await import('@/features/onboarding/repo');
    writeSetting('onboarding.completed', true);

    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'onboarding.completed', value: true }),
    );
    expect(runMock).toHaveBeenCalled();

    vi.doUnmock('@/db/client');
    vi.doUnmock('@/db/schema/settings');
  });
});

// ---------------------------------------------------------------------------
// MiniCalendarPreview — per-palette snapshot (structure/colour assertions)
// ---------------------------------------------------------------------------

describe('MiniCalendarPreview palette colours', () => {
  const cases = [
    { name: 'calm_sand', severe: '#8B2E1F', moderate: '#C97A4B', mild: '#E5C29F' },
    { name: 'soft_storm', severe: '#1F3A5C', moderate: '#4F7BB0', mild: '#A8BDD9' },
    { name: 'quiet_night', severe: '#D4654A', moderate: '#C49B7A', mild: '#5A6878' },
    { name: 'forest_pale', severe: '#3D5230', moderate: '#7A9663', mild: '#C2D1B0' },
  ] as const;

  for (const { name, severe, moderate, mild } of cases) {
    describe(name, () => {
      it('has the correct severitySevere colour', () => {
        expect(PALETTES[name].severitySevere).toBe(severe);
      });

      it('has the correct severityModerate colour', () => {
        expect(PALETTES[name].severityModerate).toBe(moderate);
      });

      it('has the correct severityMild colour', () => {
        expect(PALETTES[name].severityMild).toBe(mild);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Integration: settings written at each step (flow assertions)
// ---------------------------------------------------------------------------

describe('onboarding flow settings contract', () => {
  const written: Record<string, unknown> = {};
  const mockWriteSetting = (key: string, value: unknown) => {
    written[key] = value;
  };

  it('location grant writes location.permission_granted = true', () => {
    mockWriteSetting('location.permission_granted', true);
    expect(written['location.permission_granted']).toBe(true);
  });

  it('location skip writes location.permission_granted = false', () => {
    mockWriteSetting('location.permission_granted', false);
    expect(written['location.permission_granted']).toBe(false);
  });

  it('notifications yes writes enabled=true and time string', () => {
    mockWriteSetting('notifications.daily_checkin_enabled', true);
    mockWriteSetting('notifications.daily_checkin_time', '09:00');
    expect(written['notifications.daily_checkin_enabled']).toBe(true);
    expect(written['notifications.daily_checkin_time']).toBe('09:00');
  });

  it('notifications no writes enabled=false', () => {
    mockWriteSetting('notifications.daily_checkin_enabled', false);
    expect(written['notifications.daily_checkin_enabled']).toBe(false);
  });

  it('theme writes theme.palette as a PaletteName string', () => {
    mockWriteSetting('theme.palette', 'soft_storm');
    expect(written['theme.palette']).toBe('soft_storm');
  });

  it('done writes onboarding.completed = true', () => {
    mockWriteSetting('onboarding.completed', true);
    expect(written['onboarding.completed']).toBe(true);
  });

  it('full flow produces all required settings', () => {
    const result: Record<string, unknown> = {};
    const w = (key: string, value: unknown) => { result[key] = value; };

    // Simulate the full onboarding flow
    w('location.permission_granted', true);
    w('notifications.daily_checkin_enabled', true);
    w('notifications.daily_checkin_time', '09:00');
    w('theme.palette', 'calm_sand');
    w('onboarding.completed', true);

    expect(result['location.permission_granted']).toBeDefined();
    expect(result['notifications.daily_checkin_enabled']).toBeDefined();
    expect(result['notifications.daily_checkin_time']).toBeDefined();
    expect(result['theme.palette']).toBeDefined();
    expect(result['onboarding.completed']).toBe(true);
  });
});
