'use client';

/**
 * Mobile-only battle log - bottom bar with latest turn + fullscreen expand
 */

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';
import { HitResult, Turn } from '@/types/game';

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

// Single turn entry
function TurnEntry({ turn, isLatest, hideResult }: { turn: Turn; isLatest: boolean; hideResult: boolean }) {
  const config = getModelConfig(turn.modelId);
  const result = formatResult(turn.result);

  return (
    <div
      className={`p-3 rounded-lg ${
        isLatest && !hideResult
          ? 'bg-white/15 ring-1 ring-white/30'
          : 'bg-white/5'
      }`}
    >
      {/* Header */}
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
          <span className={`px-2 py-1 rounded text-xs font-bold ${result.bgColor} ${result.color}`}>
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
      </div>

      {/* Reasoning */}
      {turn.shot.reasoning && (
        <div className="text-white/80 mt-2 text-sm italic leading-relaxed">
          "{turn.shot.reasoning}"
        </div>
      )}
    </div>
  );
}

export function MobileBattleLog() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { phase, turns } = useGameStore();

  // Don't show during setup/ready/intro
  if (phase === 'setup' || phase === 'ready') return null;

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const hideLatestResult = phase === 'shooting';

  return (
    <>
      {/* Bottom bar - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40">
        <div className="bg-black/80 backdrop-blur-md border-t border-white/10 p-3">
          {latestTurn ? (
            <div className="flex items-center gap-3">
              {/* Latest turn preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getModelConfig(latestTurn.modelId).icon}</span>
                  <span className="text-white font-medium text-sm truncate">
                    {getModelConfig(latestTurn.modelId).name}
                  </span>
                  {hideLatestResult ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20 text-white/60 animate-pulse">
                      ...
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${formatResult(latestTurn.result).bgColor} ${formatResult(latestTurn.result).color}`}>
                      {formatResult(latestTurn.result).label}
                    </span>
                  )}
                </div>
                {latestTurn.shot.reasoning && (
                  <div className="text-white/60 text-xs mt-1 truncate italic">
                    "{latestTurn.shot.reasoning}"
                  </div>
                )}
              </div>

              {/* View all button */}
              <button
                onClick={() => setIsExpanded(true)}
                className="flex-shrink-0 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
              >
                View All ({turns.length})
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Waiting for first shot...</span>
              <button
                onClick={() => setIsExpanded(true)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Battle Log
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen expanded view */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 md:hidden bg-gray-950 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Battle Log</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Turn list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 sleek-scrollbar">
            {[...turns].reverse().map((turn, index) => (
              <TurnEntry
                key={`${turn.turnNumber}-${turn.modelId}`}
                turn={turn}
                isLatest={index === 0}
                hideResult={index === 0 && phase === 'shooting'}
              />
            ))}

            {turns.length === 0 && (
              <div className="text-center text-white/50 py-12">
                No shots recorded yet
              </div>
            )}
          </div>

          {/* Close button at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
            >
              Back to Battle
            </button>
          </div>
        </div>
      )}
    </>
  );
}
