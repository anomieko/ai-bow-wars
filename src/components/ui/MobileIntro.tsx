'use client';

/**
 * Mobile-only intro overlay - covers screen during intro phase
 * Shows model names + VS in a clean HTML format for small screens
 */

import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';

export function MobileIntro() {
  const { cameraMode, phase, leftArcher, rightArcher } = useGameStore();

  const isVisible = cameraMode === 'intro' && phase === 'ready';

  const leftConfig = leftArcher ? getModelConfig(leftArcher.modelId) : null;
  const rightConfig = rightArcher ? getModelConfig(rightArcher.modelId) : null;

  if (!isVisible || !leftConfig || !rightConfig) {
    return null;
  }

  return (
    // md:hidden = only show on mobile (hidden on md screens and up)
    <div className="fixed inset-0 z-50 md:hidden bg-gradient-to-b from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center p-6">
      {/* Left model */}
      <div className="text-center mb-6">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-5xl"
          style={{
            backgroundColor: `${leftConfig.color}30`,
            boxShadow: `0 0 40px ${leftConfig.color}40`,
          }}
        >
          {leftConfig.icon}
        </div>
        <div
          className="text-2xl font-black"
          style={{ color: leftConfig.color }}
        >
          {leftConfig.name}
        </div>
      </div>

      {/* VS */}
      <div className="text-4xl font-black text-amber-400 my-4 animate-pulse">
        VS
      </div>

      {/* Right model */}
      <div className="text-center mt-6">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-5xl"
          style={{
            backgroundColor: `${rightConfig.color}30`,
            boxShadow: `0 0 40px ${rightConfig.color}40`,
          }}
        >
          {rightConfig.icon}
        </div>
        <div
          className="text-2xl font-black"
          style={{ color: rightConfig.color }}
        >
          {rightConfig.name}
        </div>
      </div>

      {/* Subtle hint */}
      <div className="absolute bottom-8 text-white/40 text-sm">
        Match starting...
      </div>
    </div>
  );
}
