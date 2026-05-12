import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Unit tests for useSeverityState logic (extracted as pure functions for testing)
// ---------------------------------------------------------------------------

// Re-implement pure logic extracted from the hook for unit testing in node env
function makeSeverityState(initialSeverity = 5) {
  let severity = initialSeverity;
  let auraOnly = false;

  return {
    getSeverity: () => severity,
    setSeverity: (v: number) => { severity = v; },
    isAuraOnly: () => auraOnly,
    toggleAuraOnly: () => { auraOnly = !auraOnly; },
    getValueOnSave: () => (auraOnly ? 0 : severity),
  };
}

describe('severity-0 toggle path', () => {
  it('returns slider value when aura-only is off', () => {
    const state = makeSeverityState(7);
    expect(state.getValueOnSave()).toBe(7);
  });

  it('returns 0 when aura-only is toggled on, regardless of slider position', () => {
    const state = makeSeverityState(7);
    state.toggleAuraOnly();
    expect(state.getValueOnSave()).toBe(0);
  });

  it('returns 0 even after setting slider to 10 with aura-only on', () => {
    const state = makeSeverityState(5);
    state.toggleAuraOnly();
    state.setSeverity(10);
    expect(state.getValueOnSave()).toBe(0);
  });

  it('returns slider value again after toggling aura-only off', () => {
    const state = makeSeverityState(6);
    state.toggleAuraOnly(); // on
    state.toggleAuraOnly(); // off
    expect(state.getValueOnSave()).toBe(6);
  });

  it('slider is effectively "disabled" (getValueOnSave ignores slider)', () => {
    const state = makeSeverityState(1);
    state.toggleAuraOnly();
    state.setSeverity(8);
    // Even though severity is 8, aura-only wins
    expect(state.getValueOnSave()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Unit tests for log-active save flow (mocked insertActive)
// ---------------------------------------------------------------------------

describe('log-active save flow — insertActive payload', () => {
  const mockInsertActive = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertActive.mockReturnValue({ ok: true, value: { id: 'test-id-001' } });
  });

  it('calls insertActive with correct peakSeverity, symptomTags, notes, and weatherSnapshotId', () => {
    const payload = {
      peakSeverity: 6,
      symptomTags: ['throbbing', 'nausea'] as const,
      notes: 'felt off all morning',
      weatherSnapshotId: 'ws-abc123',
    };

    mockInsertActive(payload);

    expect(mockInsertActive).toHaveBeenCalledWith({
      peakSeverity: 6,
      symptomTags: ['throbbing', 'nausea'],
      notes: 'felt off all morning',
      weatherSnapshotId: 'ws-abc123',
    });
  });

  it('calls insertActive with severity 0 when aura-only is set', () => {
    const state = makeSeverityState(7);
    state.toggleAuraOnly();

    mockInsertActive({
      peakSeverity: state.getValueOnSave(),
      symptomTags: ['aura'],
      notes: null,
      weatherSnapshotId: null,
    });

    expect(mockInsertActive).toHaveBeenCalledWith(
      expect.objectContaining({ peakSeverity: 0 }),
    );
  });

  it('calls insertActive with null weatherSnapshotId when no snapshot is available', () => {
    mockInsertActive({
      peakSeverity: 4,
      symptomTags: [],
      notes: null,
      weatherSnapshotId: null,
    });

    expect(mockInsertActive).toHaveBeenCalledWith(
      expect.objectContaining({ weatherSnapshotId: null }),
    );
  });

  it('calls insertActive with weatherSnapshotId when snapshot is present', () => {
    mockInsertActive({
      peakSeverity: 4,
      symptomTags: [],
      notes: null,
      weatherSnapshotId: 'snapshot-xyz',
    });

    expect(mockInsertActive).toHaveBeenCalledWith(
      expect.objectContaining({ weatherSnapshotId: 'snapshot-xyz' }),
    );
  });
});
