import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { SymptomTag } from '@/db/schema/migraines';
import { useCurrentWeather, captureWeatherNow } from '@/features/weather/hooks';

/** Manages aura-only + severity state; severity is 0 when aura-only is on. */
export function useSeverityState(initialSeverity = 5) {
  const [severity, setSeverity] = useState(initialSeverity);
  const [auraOnly, setAuraOnly] = useState(false);

  const toggleAuraOnly = useCallback(() => {
    setAuraOnly((prev) => !prev);
  }, []);

  /** The value that should be persisted — 0 when aura-only, slider value otherwise. */
  const getValueOnSave = useCallback((): number => {
    return auraOnly ? 0 : severity;
  }, [auraOnly, severity]);

  return { severity, setSeverity, auraOnly, toggleAuraOnly, getValueOnSave };
}

/** Manages symptom chip multi-selection. */
export function useSymptomSelection(initial: SymptomTag[] = []) {
  const [selected, setSelected] = useState<SymptomTag[]>(initial);

  const toggle = useCallback((tag: SymptomTag) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  return { selected, toggle };
}

/**
 * Triggers a weather capture without blocking. Returns the snapshot id
 * from the most recent cached snapshot immediately, and fires captureWeatherNow()
 * in the background (with cache invalidation via the hook's captureNow).
 */
export function useWeatherCapture() {
  const queryClient = useQueryClient();
  const { snapshot } = useCurrentWeather();

  const captureAndGetId = useCallback(async (): Promise<string | null> => {
    // Fire capture in background — don't await. Use cached id immediately.
    void captureWeatherNow().then(() => {
      void queryClient.invalidateQueries({ queryKey: ['weather', 'current'] });
    });
    return snapshot?.id ?? null;
  }, [snapshot, queryClient]);

  return { captureAndGetId, cachedSnapshotId: snapshot?.id ?? null };
}
