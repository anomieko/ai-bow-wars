'use client';

/**
 * Game control buttons (Start, Reset)
 */

import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';

export function GameControls() {
  const {
    phase,
    startMatch,
    resetGame,
    matchSetup,
    leftArcher,
    rightArcher,
  } = useGameStore();

  if (phase === 'setup') return null;

  const leftConfig = leftArcher ? getModelConfig(leftArcher.modelId) : null;
  const rightConfig = rightArcher ? getModelConfig(rightArcher.modelId) : null;

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      {/* Match info */}
      {matchSetup && (
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Distance: {matchSetup.distance}m</span>
          <span>
            Wind: {matchSetup.wind.speed}m/s {matchSetup.wind.direction === 'left' ? '←' : '→'}
          </span>
        </div>
      )}

      {/* VS display */}
      <div className="flex items-center justify-center gap-4">
        {leftConfig && (
          <div className="text-center">
            <span className="text-3xl">{leftConfig.icon}</span>
            <div className="text-white font-semibold">{leftConfig.name}</div>
            <div className="text-xs text-gray-400">{leftArcher?.health}/2 HP</div>
          </div>
        )}
        <span className="text-2xl text-gray-500 font-bold">VS</span>
        {rightConfig && (
          <div className="text-center">
            <span className="text-3xl">{rightConfig.icon}</span>
            <div className="text-white font-semibold">{rightConfig.name}</div>
            <div className="text-xs text-gray-400">{rightArcher?.health}/2 HP</div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {phase === 'ready' && (
          <button
            onClick={startMatch}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
          >
            Start Match
          </button>
        )}

        <button
          onClick={resetGame}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {phase === 'finished' ? 'New Match' : 'Reset'}
        </button>
      </div>
    </div>
  );
}
