'use client';

/**
 * Turn-by-turn log showing AI decisions and results
 */

import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';
import { HitResult } from '@/types/game';

// Format hit result as a short label
function formatResult(result: HitResult): { label: string; color: string; bgColor: string } {
  switch (result.type) {
    case 'headshot':
      return { label: 'HEADSHOT', color: 'text-white', bgColor: 'bg-red-500' };
    case 'body':
      return { label: 'HIT', color: 'text-white', bgColor: 'bg-amber-500' };
    case 'miss':
      if (result.fellShort) {
        return { label: 'SHORT', color: 'text-blue-200', bgColor: 'bg-blue-500/40' };
      }
      if (result.distanceY > 0) {
        return { label: 'HIGH', color: 'text-orange-200', bgColor: 'bg-orange-500/40' };
      }
      return { label: 'LOW', color: 'text-purple-200', bgColor: 'bg-purple-500/40' };
  }
}

export function TurnLog() {
  const {
    phase,
    turns,
  } = useGameStore();

  if (phase === 'setup' || phase === 'ready') return null;

  return (
    <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 max-h-[60vh] flex flex-col">
      <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>Battle Log</span>
        <span className="text-white/40 font-normal normal-case">({turns.length} shots)</span>
      </h3>

      {/* Turn history */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {[...turns].reverse().slice(0, 10).map((turn, index) => {
          const config = getModelConfig(turn.modelId);
          // Hide result of the most recent turn while arrow is still flying
          const isLatestTurn = index === 0;
          const hideResult = isLatestTurn && phase === 'shooting';
          const result = formatResult(turn.result);

          return (
            <div
              key={`${turn.turnNumber}-${turn.modelId}`}
              className={`p-3 rounded-lg transition-all ${
                isLatestTurn && !hideResult
                  ? 'bg-white/15 ring-1 ring-white/30'
                  : 'bg-white/5'
              }`}
            >
              {/* Header: Icon, name, turn number, result */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-white font-medium text-sm">{config.name}</span>
                  <span className="text-white/50 text-xs">#{turn.turnNumber}</span>
                </div>

                {hideResult ? (
                  <span className="px-2 py-1 rounded text-xs font-bold bg-white/20 text-white/60 animate-pulse">
                    ...
                  </span>
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${result.bgColor} ${result.color}`}
                  >
                    {result.label}
                  </span>
                )}
              </div>

              {/* Shot parameters */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-white/50">Angle:</span>
                  <span className="text-white font-mono">{turn.shot.angle.toFixed(0)}°</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white/50">Power:</span>
                  <span className="text-white font-mono">{turn.shot.power.toFixed(0)}%</span>
                </div>
                {/* Miss details */}
                {!hideResult && turn.result.type === 'miss' && !turn.result.fellShort && (
                  <div className="flex items-center gap-1">
                    <span className="text-white/50">Off by:</span>
                    <span className="text-white font-mono">
                      {turn.result.distanceY > 0 ? '+' : ''}{turn.result.distanceY.toFixed(1)}m
                    </span>
                  </div>
                )}
              </div>

              {/* Reasoning - full text, not truncated */}
              {turn.shot.reasoning && (
                <div className="text-white/80 mt-2 text-sm italic leading-relaxed">
                  "{turn.shot.reasoning}"
                </div>
              )}
            </div>
          );
        })}

        {turns.length === 0 && (
          <div className="text-center text-white/50 py-8 text-sm">
            Waiting for first shot...
          </div>
        )}

        {turns.length > 10 && (
          <div className="text-center text-white/50 py-2 text-sm">
            +{turns.length - 10} more shots
          </div>
        )}
      </div>
    </div>
  );
}
