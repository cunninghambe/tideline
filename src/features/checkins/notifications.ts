import * as Notifications from 'expo-notifications';
import { db } from '@/db/client';
import { settings as settingsTable, dailyCheckins } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { isExpoGo } from '@/lib/runtime';

const DAILY_CHECKIN_NOTIFICATION_ID = 'daily-checkin-reminder';

function getSettingSync(key: string): string | null {
  const row = db.select().from(settingsTable).where(eq(settingsTable.key, key)).get();
  if (!row) return null;
  const v = row.value;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10));
  return {
    hour: Number.isFinite(h) ? h : 9,
    minute: Number.isFinite(m) ? m : 0,
  };
}

export async function scheduleDailyCheckinReminder(): Promise<void> {
  if (isExpoGo()) return;

  const enabled = getSettingSync('notifications.daily_checkin_enabled');
  if (enabled !== 'true') {
    await Notifications.cancelScheduledNotificationAsync(DAILY_CHECKIN_NOTIFICATION_ID).catch(() => {});
    return;
  }

  const timeStr = getSettingSync('notifications.daily_checkin_time') ?? '09:00';
  const { hour, minute } = parseTime(timeStr);

  await Notifications.cancelScheduledNotificationAsync(DAILY_CHECKIN_NOTIFICATION_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_CHECKIN_NOTIFICATION_ID,
    content: {
      title: 'Tideline',
      body: 'Quick check-in: how was yesterday?',
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

/** Returns true if no daily check-in has been logged in the last 24 hours. */
export function shouldShowCheckinFallback(): boolean {
  const latest = db
    .select()
    .from(dailyCheckins)
    .orderBy(desc(dailyCheckins.createdAt))
    .limit(1)
    .all();
  if (latest.length === 0) return true;
  const last = latest[0].createdAt;
  const lastMs = last instanceof Date ? last.getTime() : new Date(last).getTime();
  return Date.now() - lastMs > 24 * 60 * 60 * 1000;
}
