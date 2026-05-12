import * as Notifications from 'expo-notifications';

import { isExpoGo } from '@/lib/runtime';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { list } from '@/features/meds/repo';

/** In-memory set of med IDs for which a refill notification was scheduled today.
 *  Survives within a single app session; clears on cold start (acceptable per spec). */
const scheduledToday = new Set<string>();

/** Notification ID pattern per spec: refill-<medId> */
function refillNotificationId(medId: string): string {
  return `refill-${medId}`;
}

/**
 * Schedules a local notification for a single medication below its refill threshold.
 * Deduplicates within the same app session (24h window handled by the set + cancellation check).
 */
async function scheduleRefillNotification(
  medId: string,
  brandName: string,
  pillsRemaining: number,
): Promise<void> {
  if (scheduledToday.has(medId)) return;

  const notifId = refillNotificationId(medId);

  // Cancel any existing notification for this med before re-scheduling
  await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {
    // Not all platforms surface an error if the notification doesn't exist
  });

  await Notifications.scheduleNotificationAsync({
    identifier: notifId,
    content: {
      title: brandName,
      body: `${pillsRemaining} pills left. Time to refill?`,
    },
    trigger: null, // fire immediately
  });

  scheduledToday.add(medId);
}

/**
 * Runs on app foreground. For each active med below its refill threshold:
 * - If running in a real build with notifications enabled: schedules a local notification
 *   (once per med per session via in-memory dedup).
 * - If in Expo Go: returns the list of med names that need a refill so the UI can
 *   mount an AppFallbackBanner instead.
 *
 * Returns names of medications below threshold (for Expo Go banner).
 */
export async function scheduleRefillCheck(): Promise<string[]> {
  const result = list();
  if (!result.ok) return [];

  const activeMeds = result.value.filter((m) => m.active);
  const belowThreshold = activeMeds.filter(
    (m) => m.pillsRemaining != null && m.pillsRemaining <= m.refillThreshold,
  );

  if (belowThreshold.length === 0) return [];

  const belowNames = belowThreshold.map((m) => m.brandName);

  if (!isExpoGo() && FEATURE_FLAGS.notificationsLocal) {
    await Promise.all(
      belowThreshold.map((m) =>
        scheduleRefillNotification(m.id, m.brandName, m.pillsRemaining ?? 0),
      ),
    );
  }

  return belowNames;
}

/** Exposed for tests: clears the in-session dedup set. */
export function _resetScheduledSet(): void {
  scheduledToday.clear();
}

/** Exposed for tests: returns a copy of the in-session dedup set. */
export function _getScheduledSet(): Set<string> {
  return new Set(scheduledToday);
}
