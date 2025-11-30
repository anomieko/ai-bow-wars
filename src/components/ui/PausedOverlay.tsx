'use client';

/**
 * Overlay shown when the game is paused (user alt-tabbed away)
 */

import { useEffect } from 'react';
import { useGameStore } from '@/lib/game-store';
import { useVisibilityPause } from '@/lib/use-pause';

export function PausedOverlay() {
  const isPaused = useGameStore((s) => s.isPaused);
  const setPaused = useGameStore((s) => s.setPaused);

  // Set up visibility change detection
  useVisibilityPause();

  // Allow clicking or pressing any key to unpause (when manually paused)
  useEffect(() => {
    if (!isPaused) return;

    const handleInteraction = () => {
      // Only unpause if we're focused (visibility change handler should handle blur/focus)
      if (!document.hidden) {
        setPaused(false);
      }
    };

    // Small delay to prevent immediate unpause on focus
    const timer = setTimeout(() => {
      window.addEventListener('keydown', handleInteraction);
      window.addEventListener('mousedown', handleInteraction);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
    };
  }, [isPaused, setPaused]);

  if (!isPaused) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ animationPlayState: 'paused' }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4 tracking-widest">
          PAUSED
        </h1>
        <p className="text-xl text-gray-300">
          Click or press any key to resume
        </p>
      </div>
    </div>
  );
}
