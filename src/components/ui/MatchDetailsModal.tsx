'use client';

/**
 * Modal showing detailed match data - prompts, responses, turns in chat format
 */

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';
import { Turn, HitResult } from '@/types/game';

interface MatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Format result for display
function formatResult(result: HitResult): string {
  if (result.type === 'headshot') return 'HEADSHOT!';
  if (result.type === 'body') return 'Body Hit';
  if (result.fellShort) return `Fell Short`;
  if (result.distanceY > 0) return `Too High (+${result.distanceY.toFixed(1)}m)`;
  return `Too Low (${result.distanceY.toFixed(1)}m)`;
}

// Single turn in chat format
function TurnMessage({ turn, index }: { turn: Turn; index: number }) {
  const config = getModelConfig(turn.modelId);
  const [showResponse, setShowResponse] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const resultColor = turn.result.type === 'headshot'
    ? 'text-red-400'
    : turn.result.type === 'body'
      ? 'text-amber-400'
      : 'text-white/50';

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: `${config.color}30` }}
      >
        {config.icon}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white">{config.name}</span>
          <span className="text-white/30 text-xs">Shot #{turn.turnNumber}</span>
        </div>

        {/* Shot info card */}
        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          {/* Shot parameters */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-white/40">Angle:</span>
              <span className="text-white ml-1 font-mono">{turn.shot.angle.toFixed(1)}°</span>
            </div>
            <div>
              <span className="text-white/40">Power:</span>
              <span className="text-white ml-1 font-mono">{turn.shot.power.toFixed(0)}%</span>
            </div>
            <div className={`font-semibold ${resultColor}`}>
              {formatResult(turn.result)}
            </div>
          </div>

          {/* Reasoning */}
          {turn.shot.reasoning && (
            <div className="text-sm text-white/60 italic">
              "{turn.shot.reasoning}"
            </div>
          )}

          {/* Expandable sections */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowResponse(!showResponse)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showResponse
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              }`}
            >
              {showResponse ? 'Hide' : 'Show'} Response
            </button>
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showPrompt
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              }`}
            >
              {showPrompt ? 'Hide' : 'Show'} Prompt
            </button>
          </div>

          {/* Raw response */}
          {showResponse && (
            <div className="mt-2 p-3 bg-black/40 rounded-lg border border-blue-500/20">
              <div className="text-xs text-blue-400 mb-1 font-semibold">Raw AI Response:</div>
              <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono overflow-x-auto">
                {turn.rawResponse || '(No response captured - mock mode)'}
              </pre>
            </div>
          )}

          {/* Prompt */}
          {showPrompt && (
            <div className="mt-2 p-3 bg-black/40 rounded-lg border border-purple-500/20">
              <div className="text-xs text-purple-400 mb-1 font-semibold">Prompt Sent:</div>
              <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono overflow-x-auto">
                {turn.prompt || '(No prompt captured - mock mode)'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MatchDetailsModal({ isOpen, onClose }: MatchDetailsModalProps) {
  const { turns, matchSetup, leftArcher, rightArcher, winner, winReason } = useGameStore();

  const leftConfig = leftArcher ? getModelConfig(leftArcher.modelId) : null;
  const rightConfig = rightArcher ? getModelConfig(rightArcher.modelId) : null;
  const winnerConfig = winner ? getModelConfig(winner) : null;

  if (!isOpen) return null;

  // Group turns by round (every 2 turns = 1 round)
  const rounds: Turn[][] = [];
  for (let i = 0; i < turns.length; i += 2) {
    rounds.push(turns.slice(i, i + 2));
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Match Details</h2>
              <p className="text-white/40 text-sm mt-1">
                Full turn history with prompts and responses
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Match summary */}
          {matchSetup && (
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                {leftConfig && (
                  <>
                    <span className="text-xl">{leftConfig.icon}</span>
                    <span className="text-white">{leftConfig.name}</span>
                  </>
                )}
                <span className="text-white/30">vs</span>
                {rightConfig && (
                  <>
                    <span className="text-white">{rightConfig.name}</span>
                    <span className="text-xl">{rightConfig.icon}</span>
                  </>
                )}
              </div>
              <div className="text-white/40">
                {matchSetup.distance}m | Wind: {matchSetup.wind.speed}m/s {matchSetup.wind.direction === 'left' ? '←' : '→'}
              </div>
              <div className="text-white/40">
                {turns.length} total shots
              </div>
            </div>
          )}

          {/* Winner banner */}
          {winner && winnerConfig && (
            <div
              className="mt-4 p-3 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: `${winnerConfig.color}20` }}
            >
              <span className="text-2xl">{winnerConfig.icon}</span>
              <div>
                <div className="text-white font-semibold">{winnerConfig.name} wins!</div>
                <div className="text-white/60 text-sm">
                  {winReason === 'headshot' && 'By headshot'}
                  {winReason === 'bodyshot' && 'By elimination'}
                  {winReason === 'timeout' && 'By timeout (most damage)'}
                </div>
              </div>
            </div>
          )}

          {winReason === 'tie' && (
            <div className="mt-4 p-3 rounded-lg bg-purple-500/20 flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="text-2xl">{leftConfig?.icon}</span>
                <span className="text-2xl">{rightConfig?.icon}</span>
              </div>
              <div>
                <div className="text-white font-semibold">Draw!</div>
                <div className="text-white/60 text-sm">Mutual defeat or equal damage</div>
              </div>
            </div>
          )}
        </div>

        {/* Turn history - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {rounds.map((roundTurns, roundIndex) => (
              <div key={roundIndex}>
                {/* Round header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest">
                    Round {roundIndex + 1}
                  </div>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Turns in this round */}
                <div className="space-y-4">
                  {roundTurns.map((turn, turnIndex) => (
                    <TurnMessage
                      key={`${turn.turnNumber}-${turn.modelId}`}
                      turn={turn}
                      index={roundIndex * 2 + turnIndex}
                    />
                  ))}
                </div>
              </div>
            ))}

            {turns.length === 0 && (
              <div className="text-center text-white/30 py-12">
                No shots recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
