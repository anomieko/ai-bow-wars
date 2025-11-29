/**
 * Debug settings store - ONLY works in mock mode
 * These cheats help with testing specific scenarios
 */

import { create } from 'zustand';
import { HitResult } from '@/types/game';

export type DebugHitOverride = 'none' | 'headshot' | 'bodyshot' | 'miss';

interface DebugStore {
  // Whether debug mode is available (only true in mock mode)
  isDebugAvailable: boolean;
  setDebugAvailable: (available: boolean) => void;

  // Hit override for ALL shots
  hitOverride: DebugHitOverride;
  setHitOverride: (override: DebugHitOverride) => void;

  // Force tie mode - makes both archers hit each other with killing blows
  forceTieMode: boolean;
  setForceTieMode: (enabled: boolean) => void;

  // Get the appropriate hit result for a shot (respecting debug settings)
  getDebugHitResult: (side: 'left' | 'right', originalResult: HitResult) => HitResult;
}

export const useDebugStore = create<DebugStore>((set, get) => ({
  isDebugAvailable: false,
  hitOverride: 'none',
  forceTieMode: false,

  setDebugAvailable: (available) => set({ isDebugAvailable: available }),

  setHitOverride: (override) => set({ hitOverride: override, forceTieMode: false }),

  setForceTieMode: (enabled) => set({
    forceTieMode: enabled,
    hitOverride: enabled ? 'none' : get().hitOverride
  }),

  getDebugHitResult: (side, originalResult) => {
    const state = get();

    // Only apply debug overrides if debug is available (mock mode)
    if (!state.isDebugAvailable) {
      return originalResult;
    }

    // Force tie mode - headshot for all shots
    if (state.forceTieMode) {
      return { type: 'headshot' };
    }

    // Hit override
    switch (state.hitOverride) {
      case 'headshot':
        return { type: 'headshot' };
      case 'bodyshot':
        return { type: 'body' };
      case 'miss':
        return { type: 'miss', distanceX: 5, distanceY: 2 };
      default:
        return originalResult;
    }
  },
}));
