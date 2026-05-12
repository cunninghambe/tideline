import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

import { migraineEvents } from './migraines';

export type MedClass =
  | 'nsaid'
  | 'triptan'
  | 'anticonvulsant'
  | 'beta_blocker'
  | 'cgrp'
  | 'antiemetic'
  | 'opioid'
  | 'ergotamine'
  | 'other';

export const medications = sqliteTable('medications', {
  id: text('id').primaryKey(),
  brandName: text('brand_name').notNull(), // local-only; never goes to pool
  medicationClass: text('medication_class').$type<MedClass>().notNull(),
  defaultDose: text('default_dose').notNull(),
  type: text('type').$type<'rescue' | 'preventive'>().notNull(),
  pillsRemaining: integer('pills_remaining'),
  refillThreshold: integer('refill_threshold').notNull().default(7),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const medicationDoses = sqliteTable('medication_doses', {
  id: text('id').primaryKey(),
  medicationId: text('medication_id')
    .notNull()
    .references(() => medications.id),
  migraineEventId: text('migraine_event_id').references(
    () => migraineEvents.id,
  ), // null = preventive dose
  takenAt: integer('taken_at', { mode: 'timestamp' }).notNull(),
  doseAmount: text('dose_amount').notNull(),
  effectivenessRating: text('effectiveness_rating').$type<
    'helped' | 'kind_of' | 'didnt_help' | 'unsure' | null
  >(),
  timeToReliefMinutes: integer('time_to_relief_minutes'),
});
