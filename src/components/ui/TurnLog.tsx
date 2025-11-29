'use client';

/**
 * Turn-by-turn log showing AI decisions and results
 */

import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';
import { formatHitResult } from '@/lib/physics';

export function TurnLog() {
  const {
    phase,
    turns,
    turnNumber,
    currentTurn,
    leftArcher,
    rightArcher,
    thinkingModelId,
    winner,
    winReason,
  } = useGameStore();

  if (phase === 'setup') return null;

  const currentArcher = currentTurn === 'left' ? leftArcher : rightArcher;
  const currentConfig = currentArcher ? getModelConfig(currentArcher.modelId) : null;

  return (
    <div className="bg-gray-900 rounded-lg p-4 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold text-white mb-3">Battle Log</h3>

      {/* Current status */}
      {phase !== 'finished' && phase !== 'setup' && phase !== 'ready' && currentConfig && (
        <div
          className="p-3 rounded-lg mb-3"
          style={{ backgroundColor: `${currentConfig.color}33` }}
        >
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">{currentConfig.icon}</span>
            <span className="font-semibold">Turn {turnNumber}</span>
            <span className="text-gray-300">- {currentConfig.name}</span>
          </div>
          {phase === 'thinking' && (
            <div className="text-sm text-gray-300 mt-1 animate-pulse">
              Calculating shot...
            </div>
          )}
          {phase === 'shooting' && (
            <div className="text-sm text-yellow-400 mt-1">
              Arrow in flight!
            </div>
          )}
        </div>
      )}

      {/* Winner announcement */}
      {phase === 'finished' && winner && (
        <div className="p-4 rounded-lg mb-3 bg-yellow-600 text-center">
          <div className="text-2xl mb-1">
            {getModelConfig(winner).icon} {getModelConfig(winner).name} WINS!
          </div>
          <div className="text-sm text-yellow-200">
            {winReason === 'headshot' && 'Headshot!'}
            {winReason === 'bodyshot' && 'Two body shots!'}
            {winReason === 'timeout' && 'Most damage after 30 turns'}
          </div>
        </div>
      )}

      {/* Turn history */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {[...turns].reverse().map((turn) => {
          const config = getModelConfig(turn.modelId);
          const isHit = turn.result.type !== 'miss';

          return (
            <div
              key={`${turn.turnNumber}-${turn.modelId}`}
              className="p-2 rounded bg-gray-800 text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span className="text-gray-400">T{turn.turnNumber}</span>
                  <span className="text-white">{config.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    turn.result.type === 'headshot'
                      ? 'bg-red-600 text-white'
                      : turn.result.type === 'body'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {formatHitResult(turn.result)}
                </span>
              </div>
              <div className="text-gray-400 mt-1">
                {turn.shot.angle}° / {turn.shot.power}%
                {turn.shot.reasoning && (
                  <span className="text-gray-500 ml-2">- {turn.shot.reasoning}</span>
                )}
              </div>
            </div>
          );
        })}

        {turns.length === 0 && phase !== 'setup' && (
          <div className="text-center text-gray-500 py-8">
            {phase === 'ready' ? 'Press Start to begin!' : 'No shots fired yet'}
          </div>
        )}
      </div>
    </div>
  );
}
