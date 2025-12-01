'use client';

/**
 * Wake lock hook - prevents screen from sleeping during matches (mobile only)
 * Uses NoSleep.js for cross-browser compatibility including iOS Safari
 */

import { useEffect, useRef } from 'react';

// Mobile detection - only enable on touch devices
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for touch capability and screen size
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  // Also check user agent for mobile keywords as backup
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return hasTouchScreen && (isSmallScreen || mobileUA);
}

/**
 * Hook to prevent screen from sleeping during active gameplay
 * @param isActive - Whether wake lock should be active (e.g., match in progress)
 */
export function useWakeLock(isActive: boolean) {
  const noSleepRef = useRef<InstanceType<typeof import('nosleep.js').default> | null>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    // Only run on mobile devices
    if (!isMobileDevice()) {
      return;
    }

    // Dynamically import NoSleep to avoid SSR issues
    const initNoSleep = async () => {
      try {
        const NoSleep = (await import('nosleep.js')).default;

        if (!noSleepRef.current) {
          noSleepRef.current = new NoSleep();
        }

        if (isActive && !enabledRef.current) {
          // Enable wake lock
          await noSleepRef.current.enable();
          enabledRef.current = true;
          console.log('[WakeLock] Enabled - screen will stay awake');
        } else if (!isActive && enabledRef.current) {
          // Disable wake lock
          noSleepRef.current.disable();
          enabledRef.current = false;
          console.log('[WakeLock] Disabled - screen can sleep');
        }
      } catch (err) {
        // Silently fail - wake lock is a nice-to-have, not critical
        console.warn('[WakeLock] Failed to initialize:', err);
      }
    };

    initNoSleep();

    // Cleanup on unmount
    return () => {
      if (noSleepRef.current && enabledRef.current) {
        noSleepRef.current.disable();
        enabledRef.current = false;
        console.log('[WakeLock] Cleanup - disabled');
      }
    };
  }, [isActive]);

  // Handle visibility change - re-enable when page becomes visible
  useEffect(() => {
    if (!isMobileDevice()) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && noSleepRef.current) {
        try {
          // Re-enable after visibility change (some browsers release on hide)
          if (!enabledRef.current) {
            await noSleepRef.current.enable();
            enabledRef.current = true;
            console.log('[WakeLock] Re-enabled after visibility change');
          }
        } catch (err) {
          console.warn('[WakeLock] Failed to re-enable:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);
}
