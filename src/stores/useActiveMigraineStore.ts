import { create } from 'zustand';

type ActiveMigraineState = {
  activeMigraineId: string | null;
  setActiveMigraineId: (id: string) => void;
  clearActive: () => void;
};

/**
 * Single source of truth for the currently active migraine id.
 * Hydrated from migraines/repo::getActive() on app mount in the root layout.
 */
export const useActiveMigraineStore = create<ActiveMigraineState>((set) => ({
  activeMigraineId: null,
  setActiveMigraineId: (id) => set({ activeMigraineId: id }),
  clearActive: () => set({ activeMigraineId: null }),
}));
