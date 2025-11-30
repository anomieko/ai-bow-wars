/**
 * Pause system hooks for handling alt-tab/visibility changes
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './game-store';

/**
 * Hook that automatically pauses the game when tab loses focus
 * Should be used once at the app level
 */
export function useVisibilityPause() {
  const screen = useGameStore((s) => s.screen);
  const setPaused = useGameStore((s) => s.setPaused);

  useEffect(() => {
    // Only pause during active game, not in menus
    const handleVisibilityChange = () => {
      if (screen === 'game') {
        const isHidden = document.hidden;
        setPaused(isHidden);
      }
    };

    // Also handle window blur/focus for multi-monitor setups
    const handleBlur = () => {
      if (screen === 'game') {
        setPaused(true);
      }
    };

    const handleFocus = () => {
      if (screen === 'game') {
        setPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [screen, setPaused]);
}

/**
 * Hook for creating a pauseable timeout
 * The timeout pauses when game is paused and resumes when unpaused
 */
export function usePauseableTimeout(
  callback: () => void,
  delay: number | null,
  deps: React.DependencyList = []
) {
  const isPaused = useGameStore((s) => s.isPaused);
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // No timeout if delay is null
    if (delay === null) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isPaused) {
      // Pause: calculate remaining time
      if (startTimeRef.current > 0) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      }
      return;
    }

    // Start or resume timeout
    const timeToWait = remainingRef.current > 0 ? remainingRef.current : delay;
    remainingRef.current = timeToWait;
    startTimeRef.current = Date.now();

    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
      remainingRef.current = 0;
      startTimeRef.current = 0;
    }, timeToWait);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, isPaused, ...deps]);

  // Reset function to restart the timer
  const reset = useCallback(() => {
    remainingRef.current = 0;
    startTimeRef.current = 0;
  }, []);

  return { reset };
}

/**
 * Hook for creating a pauseable promise that resolves after a delay
 * Returns a function that creates the promise
 * Properly cleans up all timeouts on component unmount
 */
export function usePauseableDelay() {
  const isPausedRef = useRef(false);
  const isPaused = useGameStore((s) => s.isPaused);
  // Track all active timeouts so we can clean them up
  const activeTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  // Keep ref in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear all active timeouts
      activeTimeoutsRef.current.forEach(id => clearTimeout(id));
      activeTimeoutsRef.current.clear();
    };
  }, []);

  const createDelay = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => {
      let remaining = ms;
      let startTime = Date.now();

      const scheduleTimeout = (fn: () => void, delay: number): NodeJS.Timeout => {
        const id = setTimeout(() => {
          activeTimeoutsRef.current.delete(id);
          fn();
        }, delay);
        activeTimeoutsRef.current.add(id);
        return id;
      };

      const tick = () => {
        // Don't continue if unmounted
        if (!isMountedRef.current) {
          resolve(); // Resolve immediately to unblock awaiting code
          return;
        }

        if (isPausedRef.current) {
          // Paused - calculate remaining and wait for unpause
          const elapsed = Date.now() - startTime;
          remaining = Math.max(0, remaining - elapsed);

          // Poll for unpause
          const checkPause = () => {
            if (!isMountedRef.current) {
              resolve();
              return;
            }
            if (!isPausedRef.current) {
              startTime = Date.now();
              scheduleTimeout(tick, remaining);
            } else {
              scheduleTimeout(checkPause, 100);
            }
          };
          scheduleTimeout(checkPause, 100);
        } else if (remaining <= 0) {
          resolve();
        } else {
          startTime = Date.now();
          scheduleTimeout(() => {
            const elapsed = Date.now() - startTime;
            remaining = Math.max(0, remaining - elapsed);
            tick();
          }, remaining);
        }
      };

      tick();
    });
  }, []);

  return createDelay;
}
