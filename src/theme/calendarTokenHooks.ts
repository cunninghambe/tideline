import { useSetting, useSetSetting } from '@/features/settings/store';

import {
  ACCENT_INTENSITIES,
  CALENDAR_SETTING_KEYS,
  DENSITIES,
  isAccentIntensityName,
  isCalendarLayout,
  isDensityName,
  type AccentIntensityName,
  type CalendarLayout,
  type DensityName,
  type DensityTokens,
} from './calendarTokens';

export function useCalendarLayout(): CalendarLayout {
  const raw = useSetting(CALENDAR_SETTING_KEYS.layout, 'grid');
  return isCalendarLayout(raw) ? raw : 'grid';
}

export function useDensityName(): DensityName {
  const raw = useSetting(CALENDAR_SETTING_KEYS.density, 'standard');
  return isDensityName(raw) ? raw : 'standard';
}

export function useDensity(): DensityTokens {
  return DENSITIES[useDensityName()];
}

export function useAccentIntensityName(): AccentIntensityName {
  const raw = useSetting(CALENDAR_SETTING_KEYS.accentIntensity, 'standard');
  return isAccentIntensityName(raw) ? raw : 'standard';
}

export function useAccentOpacity(): number {
  return ACCENT_INTENSITIES[useAccentIntensityName()].opacity;
}

export function useShowCycle(): boolean {
  const raw = useSetting(CALENDAR_SETTING_KEYS.showCycle, 'true');
  return raw !== 'false';
}

export function useCalendarPreferenceWriters() {
  const { mutate } = useSetSetting();
  return {
    setLayout: (v: CalendarLayout) =>
      mutate({ key: CALENDAR_SETTING_KEYS.layout, value: v }),
    setDensity: (v: DensityName) =>
      mutate({ key: CALENDAR_SETTING_KEYS.density, value: v }),
    setAccentIntensity: (v: AccentIntensityName) =>
      mutate({ key: CALENDAR_SETTING_KEYS.accentIntensity, value: v }),
    setShowCycle: (v: boolean) =>
      mutate({ key: CALENDAR_SETTING_KEYS.showCycle, value: v ? 'true' : 'false' }),
  };
}
