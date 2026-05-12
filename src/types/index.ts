import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Re-export Drizzle row types for every table
export type {
  migraineEvents,
  medications,
  medicationDoses,
  dailyCheckins,
  foodTags,
  cycleEvents,
  weatherSnapshots,
  deviceLocations,
  settings,
  outbox,
} from '@/db/schema';

export type MigraineRow = InferSelectModel<typeof import('@/db/schema').migraineEvents>;
export type MigraineInsert = InferInsertModel<typeof import('@/db/schema').migraineEvents>;

export type MedicationRow = InferSelectModel<typeof import('@/db/schema').medications>;
export type MedicationInsert = InferInsertModel<typeof import('@/db/schema').medications>;

export type MedicationDoseRow = InferSelectModel<typeof import('@/db/schema').medicationDoses>;
export type MedicationDoseInsert = InferInsertModel<typeof import('@/db/schema').medicationDoses>;

export type DailyCheckinRow = InferSelectModel<typeof import('@/db/schema').dailyCheckins>;
export type DailyCheckinInsert = InferInsertModel<typeof import('@/db/schema').dailyCheckins>;

export type FoodTagRow = InferSelectModel<typeof import('@/db/schema').foodTags>;
export type FoodTagInsert = InferInsertModel<typeof import('@/db/schema').foodTags>;

export type CycleEventRow = InferSelectModel<typeof import('@/db/schema').cycleEvents>;
export type CycleEventInsert = InferInsertModel<typeof import('@/db/schema').cycleEvents>;

export type WeatherSnapshotRow = InferSelectModel<typeof import('@/db/schema').weatherSnapshots>;
export type WeatherSnapshotInsert = InferInsertModel<typeof import('@/db/schema').weatherSnapshots>;

export type DeviceLocationRow = InferSelectModel<typeof import('@/db/schema').deviceLocations>;
export type DeviceLocationInsert = InferInsertModel<typeof import('@/db/schema').deviceLocations>;

export type SettingsRow = InferSelectModel<typeof import('@/db/schema').settings>;
export type OutboxRow = InferSelectModel<typeof import('@/db/schema').outbox>;

// Re-export enum unions
export type { SymptomTag, HelperTag, PostState } from '@/db/schema/migraines';
export type { MedClass } from '@/db/schema/medications';
export type { PaletteName } from '@/theme/palettes';
export type { CyclePhase } from '@/features/cycle/repo';

// Re-export Result and AppError
export type { Result, AppError } from '@/lib/result';
export { ok, err } from '@/lib/result';
