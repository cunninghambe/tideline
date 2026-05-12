/**
 * Pure logic for log-retro — no React Native imports so unit tests
 * can run in Node environment without RN parse errors.
 */

import type { HelperTag, SymptomTag } from '@/db/schema/migraines';

export type EffectivenessRating = 'helped' | 'kind_of' | 'didnt_help' | 'unsure';

export type QueuedDose = {
  medicationId: string;
  doseAmount: string;
  takenAt: Date;
  effectivenessRating: EffectivenessRating | null;
};

export type RetroFormState = {
  startDate: string; // YYYY-MM-DD
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endDate: string; // YYYY-MM-DD
  endHour: number;
  endMinute: number;
  stillGoing: boolean;
  peakSeverity: number; // 1-10, or 0 if auraOnly
  auraOnly: boolean;
  symptomTags: SymptomTag[];
  waterCups: number;
  foodTagIds: string[];
  helpers: HelperTag[];
  notes: string;
  queuedDoses: QueuedDose[];
};

/** Initial form state for a new (insert) retrospective log. */
export function makeInitialState(prefillDate?: string): RetroFormState {
  const now = new Date();
  const dateStr = prefillDate ?? toISODate(now);
  const hour = now.getHours();
  const minute = now.getMinutes();

  return {
    startDate: dateStr,
    startHour: hour,
    startMinute: minute,
    endDate: dateStr,
    endHour: hour,
    endMinute: minute,
    stillGoing: false,
    peakSeverity: 5,
    auraOnly: false,
    symptomTags: [],
    waterCups: 0,
    foodTagIds: [],
    helpers: [],
    notes: '',
    queuedDoses: [],
  };
}

/** Returns true if any field differs from the initial blank state. */
export function hasChanged(state: RetroFormState, initial: RetroFormState): boolean {
  return (
    state.startDate !== initial.startDate ||
    state.startHour !== initial.startHour ||
    state.startMinute !== initial.startMinute ||
    state.endDate !== initial.endDate ||
    state.endHour !== initial.endHour ||
    state.endMinute !== initial.endMinute ||
    state.stillGoing !== initial.stillGoing ||
    state.peakSeverity !== initial.peakSeverity ||
    state.auraOnly !== initial.auraOnly ||
    state.symptomTags.length !== initial.symptomTags.length ||
    state.waterCups !== initial.waterCups ||
    state.foodTagIds.length !== initial.foodTagIds.length ||
    state.helpers.length !== initial.helpers.length ||
    state.notes !== initial.notes ||
    state.queuedDoses.length !== initial.queuedDoses.length
  );
}

/** Combines date + hour + minute into a Date object. */
export function toDate(dateStr: string, hour: number, minute: number): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year!, month! - 1, day!, hour, minute, 0, 0);
}

/** Formats a Date to YYYY-MM-DD in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Formats hour/minute as HH:MM. */
export function formatHHMM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Normalises a food tag name: lowercase + trim. */
export function normaliseFoodTagName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Toggles a value in a list: adds if absent, removes if present.
 * Returns a new array.
 */
export function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
