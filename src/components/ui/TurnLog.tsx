'use client';

/**
 * Turn-by-turn log showing AI decisions and results - Modern clean design
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
    <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 max-h-[50vh] flex flex-col">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>Battle Log</span>
        <span className="text-white/20 font-normal normal-case">({turns.length} shots)</span>
      </h3>

      {/* Turn history */}
      <div className="flex-1 overflow-y-auto space-y-2 text-xs">
        {[...turns].reverse().slice(0, 10).map((turn) => {
          const config = getModelConfig(turn.modelId);

          return (
            <div
              key={`${turn.turnNumber}-${turn.modelId}`}
              className="p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-white/30">#{turn.turnNumber}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                    turn.result.type === 'headshot'
                      ? 'bg-red-500/80 text-white'
                      : turn.result.type === 'body'
                        ? 'bg-amber-500/80 text-white'
                        : 'bg-white/10 text-white/50'
                  }`}
                >
                  {formatHitResult(turn.result)}
                </span>
              </div>
              <div className="text-white/40 mt-1 flex items-center gap-2">
                <span>{turn.shot.angle.toFixed(1)}° @ {turn.shot.power.toFixed(0)}%</span>
              </div>
              {turn.shot.reasoning && (
                <div className="text-white/30 mt-1 italic truncate text-[11px]" title={turn.shot.reasoning}>
                  "{turn.shot.reasoning}"
                </div>
              )}
            </div>
          );
        })}

        {turns.length === 0 && (
          <div className="text-center text-white/30 py-6">
            Waiting for first shot...
          </div>
        )}

        {turns.length > 10 && (
          <div className="text-center text-white/30 py-1 text-xs">
            +{turns.length - 10} more shots
          </div>
        )}
      </div>
    </div>
  );
}
