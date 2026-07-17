import { describe, it, expect } from 'vitest';

import { replaceEqualDateAware } from './structuralSharing';

// Shapes mirror Drizzle rows: plain objects with Date columns.
const row = (id: string, startedAt: string, severity: number) => ({
  id,
  startedAt: new Date(startedAt),
  peakSeverity: severity,
});

describe('replaceEqualDateAware', () => {
  it('returns next when prev is undefined (initial fetch)', () => {
    const next = [row('a', '2026-05-01T08:00:00Z', 5)];
    expect(replaceEqualDateAware(undefined, next)).toBe(next);
  });

  it('keeps the previous array reference when a refetch returns equal data with new Date instances', () => {
    const prev = [row('a', '2026-05-01T08:00:00Z', 5), row('b', '2026-05-02T09:30:00Z', 7)];
    const next = [row('a', '2026-05-01T08:00:00Z', 5), row('b', '2026-05-02T09:30:00Z', 7)];

    expect(replaceEqualDateAware(prev, next)).toBe(prev);
  });

  it('preserves references of unchanged rows when one row changes', () => {
    const prev = [row('a', '2026-05-01T08:00:00Z', 5), row('b', '2026-05-02T09:30:00Z', 7)];
    const next = [row('a', '2026-05-01T08:00:00Z', 5), row('b', '2026-05-02T09:30:00Z', 8)];

    const result = replaceEqualDateAware(prev, next) as typeof prev;
    expect(result).not.toBe(prev);
    expect(result[0]).toBe(prev[0]); // unchanged row keeps its reference
    expect(result[1]).not.toBe(prev[1]);
    expect(result[1]!.peakSeverity).toBe(8);
  });

  it('detects a changed Date value', () => {
    const prev = [row('a', '2026-05-01T08:00:00Z', 5)];
    const next = [row('a', '2026-05-01T10:00:00Z', 5)];

    const result = replaceEqualDateAware(prev, next) as typeof prev;
    expect(result).not.toBe(prev);
    expect(result[0]!.startedAt.getTime()).toBe(new Date('2026-05-01T10:00:00Z').getTime());
  });

  it('keeps the previous Date instance when timestamps match', () => {
    const prev = { capturedAt: new Date('2026-05-01T08:00:00Z') };
    const next = { capturedAt: new Date('2026-05-01T08:00:00Z') };

    expect(replaceEqualDateAware(prev, next)).toBe(prev);
  });

  it('handles nested objects containing arrays', () => {
    const prev = { rows: [row('a', '2026-05-01T08:00:00Z', 5)], count: 1 };
    const next = { rows: [row('a', '2026-05-01T08:00:00Z', 5)], count: 1 };

    expect(replaceEqualDateAware(prev, next)).toBe(prev);
  });

  it('detects added and removed rows', () => {
    const prev = [row('a', '2026-05-01T08:00:00Z', 5)];
    const grown = [row('a', '2026-05-01T08:00:00Z', 5), row('b', '2026-05-02T09:30:00Z', 7)];

    const result = replaceEqualDateAware(prev, grown) as typeof prev;
    expect(result).not.toBe(prev);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(prev[0]);

    const shrunk = replaceEqualDateAware(grown, prev) as typeof prev;
    expect(shrunk).not.toBe(grown);
    expect(shrunk).toHaveLength(1);
  });

  it('returns next for mismatched types and null', () => {
    expect(replaceEqualDateAware([1], null)).toBe(null);
    expect(replaceEqualDateAware(null, 3)).toBe(3);
    const obj = { a: 1 };
    expect(replaceEqualDateAware([1], obj)).toBe(obj);
  });
});
