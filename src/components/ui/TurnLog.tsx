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
  } = useGameStore();

  if (phase === 'setup' || phase === 'ready') return null;

  const currentArcher = currentTurn === 'left' ? leftArcher : rightArcher;
  const currentConfig = currentArcher ? getModelConfig(currentArcher.modelId) : null;

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 max-h-[50vh] flex flex-col">
      <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
        <span>Battle Log</span>
        <span className="text-xs font-normal">({turns.length} shots)</span>
      </h3>

      {/* Turn history */}
      <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
        {[...turns].reverse().slice(0, 10).map((turn) => {
          const config = getModelConfig(turn.modelId);

          return (
            <div
              key={`${turn.turnNumber}-${turn.modelId}`}
              className="p-2 rounded bg-gray-800/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>{config.icon}</span>
                  <span className="text-gray-500">#{turn.turnNumber}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    turn.result.type === 'headshot'
                      ? 'bg-red-600 text-white'
                      : turn.result.type === 'body'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {formatHitResult(turn.result)}
                </span>
              </div>
              <div className="text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{turn.shot.angle.toFixed(1)}° @ {turn.shot.power.toFixed(0)}%</span>
              </div>
              {turn.shot.reasoning && (
                <div className="text-gray-600 mt-1 italic truncate" title={turn.shot.reasoning}>
                  "{turn.shot.reasoning}"
                </div>
              )}
            </div>
          );
        })}

        {turns.length === 0 && (
          <div className="text-center text-gray-600 py-4">
            Waiting for first shot...
          </div>
        )}

        {turns.length > 10 && (
          <div className="text-center text-gray-600 py-1 text-xs">
            +{turns.length - 10} more shots
          </div>
        )}
      </div>
    </div>
  );
}
