import { db } from '@/db/client';
import {
  migraineEvents,
  medications,
  medicationDoses,
  dailyCheckins,
  foodTags,
  cycleEvents,
  weatherSnapshots,
  settings,
} from '@/db/schema';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';
import * as FileSystemLegacy from 'expo-file-system/build/legacy/FileSystem';
import { EncodingType } from 'expo-file-system/build/legacy/FileSystem.types';

type ExportResult = { filePath: string };

/**
 * Serialises every table into a single JSON file and writes it to the app's
 * cache directory. Returns the file path on success for use with Share.share().
 */
export async function generateExport(): Promise<Result<ExportResult>> {
  try {
    const migraines = db.select().from(migraineEvents).all();
    const meds = db.select().from(medications).all();
    const doses = db.select().from(medicationDoses).all();
    const checkins = db.select().from(dailyCheckins).all();
    const tags = db.select().from(foodTags).all();
    const cycle = db.select().from(cycleEvents).all();
    const weather = db.select().from(weatherSnapshots).all();
    const settingsRows = db.select().from(settings).all();

    const settingsMap: Record<string, unknown> = {};
    for (const row of settingsRows) {
      settingsMap[row.key] = row.value;
    }

    const payload = {
      tideline_export_version: '1',
      exported_at: new Date().toISOString(),
      user: { id: null, email: null },
      migraine_events: migraines,
      medications: meds,
      medication_doses: doses,
      daily_checkins: checkins,
      food_tags: tags,
      cycle_events: cycle,
      weather_snapshots: weather,
      settings: settingsMap,
    };

    const json = JSON.stringify(payload, null, 2);
    const fileName = `tideline-export-${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = `${FileSystemLegacy.cacheDirectory ?? ''}${fileName}`;

    await FileSystemLegacy.writeAsStringAsync(filePath, json, {
      encoding: EncodingType.UTF8,
    });

    return ok({ filePath });
  } catch (e) {
    return err({
      kind: 'unknown',
      message: 'Export failed',
      cause: e,
    });
  }
}
