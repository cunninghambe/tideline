import { describe, it, expect } from 'vitest';
import { deriveEffectivenessStats, dosesPerWeek } from './effectiveness';

describe('deriveEffectivenessStats', () => {
  it('returns zeros for an empty list', () => {
    const stats = deriveEffectivenessStats([]);
    expect(stats.totalDoses).toBe(0);
    expect(stats.attacksUsedIn).toBe(0);
    expect(stats.helpedCount).toBe(0);
    expect(stats.kindOfCount).toBe(0);
    expect(stats.didntHelpCount).toBe(0);
    expect(stats.avgTimeToReliefMinutes).toBeNull();
  });

  it('counts distinct migraine events for attacksUsedIn (per spec §10.3)', () => {
    const doses = [
      { migraineEventId: 'attack-1', effectivenessRating: 'helped', timeToReliefMinutes: 60 },
      { migraineEventId: 'attack-1', effectivenessRating: 'helped', timeToReliefMinutes: 60 },
      { migraineEventId: 'attack-2', effectivenessRating: 'helped', timeToReliefMinutes: null },
      { migraineEventId: 'attack-3', effectivenessRating: 'kind_of', timeToReliefMinutes: null },
      { migraineEventId: null, effectivenessRating: 'helped', timeToReliefMinutes: null },
    ];
    const stats = deriveEffectivenessStats(doses);
    expect(stats.totalDoses).toBe(5);
    expect(stats.attacksUsedIn).toBe(3);
  });

  it('counts ratings correctly with mixed ratings', () => {
    const doses = [
      { effectivenessRating: 'helped', timeToReliefMinutes: 60 },
      { effectivenessRating: 'helped', timeToReliefMinutes: 90 },
      { effectivenessRating: 'kind_of', timeToReliefMinutes: null },
      { effectivenessRating: 'didnt_help', timeToReliefMinutes: null },
      { effectivenessRating: 'unsure', timeToReliefMinutes: null },
    ];
    const stats = deriveEffectivenessStats(doses);
    expect(stats.totalDoses).toBe(5);
    expect(stats.helpedCount).toBe(2);
    expect(stats.kindOfCount).toBe(1);
    expect(stats.didntHelpCount).toBe(1);
  });

  it('returns null avgTimeToRelief when fewer than 3 doses have relief time', () => {
    const doses = [
      { effectivenessRating: 'helped', timeToReliefMinutes: 60 },
      { effectivenessRating: 'helped', timeToReliefMinutes: 90 },
    ];
    const stats = deriveEffectivenessStats(doses);
    expect(stats.avgTimeToReliefMinutes).toBeNull();
  });

  it('computes average relief time when 3+ doses have non-null relief time', () => {
    const doses = [
      { effectivenessRating: 'helped', timeToReliefMinutes: 60 },
      { effectivenessRating: 'helped', timeToReliefMinutes: 90 },
      { effectivenessRating: 'helped', timeToReliefMinutes: 120 },
    ];
    const stats = deriveEffectivenessStats(doses);
    expect(stats.avgTimeToReliefMinutes).toBe(90);
  });

  it('averages only doses with non-null relief time (some null)', () => {
    const doses = [
      { effectivenessRating: 'helped', timeToReliefMinutes: 30 },
      { effectivenessRating: 'helped', timeToReliefMinutes: null },
      { effectivenessRating: 'helped', timeToReliefMinutes: 60 },
      { effectivenessRating: 'helped', timeToReliefMinutes: 90 },
    ];
    const stats = deriveEffectivenessStats(doses);
    // 3 non-null times: 30, 60, 90 → avg = 60
    expect(stats.avgTimeToReliefMinutes).toBe(60);
  });

  it('handles all "didnt_help" with no relief times', () => {
    const doses = [
      { effectivenessRating: 'didnt_help', timeToReliefMinutes: null },
      { effectivenessRating: 'didnt_help', timeToReliefMinutes: null },
      { effectivenessRating: 'didnt_help', timeToReliefMinutes: null },
    ];
    const stats = deriveEffectivenessStats(doses);
    expect(stats.didntHelpCount).toBe(3);
    expect(stats.helpedCount).toBe(0);
    expect(stats.kindOfCount).toBe(0);
    expect(stats.avgTimeToReliefMinutes).toBeNull();
  });

  it('ignores null and undefined effectivenessRating', () => {
    const doses = [
      { effectivenessRating: null, timeToReliefMinutes: null },
      { effectivenessRating: undefined, timeToReliefMinutes: null },
      { effectivenessRating: 'helped', timeToReliefMinutes: null },
    ];
    const stats = deriveEffectivenessStats(doses);
    expect(stats.totalDoses).toBe(3);
    expect(stats.helpedCount).toBe(1);
    expect(stats.didntHelpCount).toBe(0);
  });
});

describe('dosesPerWeek', () => {
  it('returns null for empty list', () => {
    expect(dosesPerWeek([], new Date())).toBeNull();
  });

  it('computes rate for doses within 30 days', () => {
    const now = new Date('2026-05-11T12:00:00Z');
    const doses = [
      { takenAt: new Date('2026-05-10T12:00:00Z') },
      { takenAt: new Date('2026-05-07T12:00:00Z') },
      { takenAt: new Date('2026-04-20T12:00:00Z') }, // within 30 days
    ];
    // 3 doses in 30 days → 3/30*7 = 0.7
    const rate = dosesPerWeek(doses, now);
    expect(rate).toBeCloseTo(0.7, 1);
  });

  it('excludes doses older than 30 days', () => {
    const now = new Date('2026-05-11T12:00:00Z');
    const doses = [
      { takenAt: new Date('2026-04-10T12:00:00Z') }, // 31 days ago — excluded
      { takenAt: new Date('2026-05-01T12:00:00Z') }, // 10 days ago — included
    ];
    const rate = dosesPerWeek(doses, now);
    // 1 dose in 30 days → 1/30*7 ≈ 0.233
    expect(rate).toBeCloseTo((1 / 30) * 7, 2);
  });

  it('returns null when all doses are older than 30 days', () => {
    const now = new Date('2026-05-11T12:00:00Z');
    const doses = [
      { takenAt: new Date('2026-03-01T12:00:00Z') },
    ];
    expect(dosesPerWeek(doses, now)).toBeNull();
  });
});
