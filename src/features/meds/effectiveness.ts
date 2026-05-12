/** Pure derivation functions for medication effectiveness stats. No React, no RN, no DB. */

export type EffectivenessStats = {
  totalDoses: number;
  /** Distinct migraine events this med was used in (per spec §10.3). */
  attacksUsedIn: number;
  helpedCount: number;
  kindOfCount: number;
  didntHelpCount: number;
  /** Only present when 3+ doses have a non-null timeToReliefMinutes */
  avgTimeToReliefMinutes: number | null;
};

type DoseSummary = {
  migraineEventId?: string | null;
  effectivenessRating: string | null | undefined;
  timeToReliefMinutes: number | null | undefined;
};

export function deriveEffectivenessStats(doses: DoseSummary[]): EffectivenessStats {
  let helpedCount = 0;
  let kindOfCount = 0;
  let didntHelpCount = 0;
  const reliefTimes: number[] = [];
  const attackIds = new Set<string>();

  for (const dose of doses) {
    if (dose.effectivenessRating === 'helped') helpedCount++;
    else if (dose.effectivenessRating === 'kind_of') kindOfCount++;
    else if (dose.effectivenessRating === 'didnt_help') didntHelpCount++;

    if (dose.timeToReliefMinutes != null) {
      reliefTimes.push(dose.timeToReliefMinutes);
    }

    if (dose.migraineEventId) attackIds.add(dose.migraineEventId);
  }

  const avgTimeToReliefMinutes =
    reliefTimes.length >= 3
      ? Math.round(reliefTimes.reduce((a, b) => a + b, 0) / reliefTimes.length)
      : null;

  return {
    totalDoses: doses.length,
    attacksUsedIn: attackIds.size,
    helpedCount,
    kindOfCount,
    didntHelpCount,
    avgTimeToReliefMinutes,
  };
}

/** Computes doses-per-week over the last 30 days for supply estimation. */
export function dosesPerWeek(
  doses: { takenAt: Date }[],
  fromDate: Date,
): number | null {
  const thirtyDaysAgo = new Date(fromDate.getTime() - 30 * 86_400_000);
  const recentDoses = doses.filter((d) => d.takenAt >= thirtyDaysAgo);
  if (recentDoses.length === 0) return null;
  return (recentDoses.length / 30) * 7;
}
