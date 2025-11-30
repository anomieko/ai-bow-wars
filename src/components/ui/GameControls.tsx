'use client';

/**
 * Game HUD overlay - Modern game UI with clean aesthetics
 */

import { useState } from 'react';
import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';
import { MatchDetailsModal } from './MatchDetailsModal';

export function GameControls() {
  const {
    phase,
    cameraMode,
    backToMenu,
    matchSetup,
    leftArcher,
    rightArcher,
    currentTurn,
    roundNumber,
    shotsThisRound,
    thinkingModelId,
    winner,
    winReason,
    lastHitResult,
    firstShotWouldKill,
    pendingDamage,
    selectRandomModels,
  } = useGameStore();

  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (phase === 'setup') return null;

  const leftConfig = leftArcher ? getModelConfig(leftArcher.modelId) : null;
  const rightConfig = rightArcher ? getModelConfig(rightArcher.modelId) : null;
  const winnerConfig = winner ? getModelConfig(winner) : null;

  const isThinking = phase === 'thinking' && thinkingModelId;
  const thinkingConfig = thinkingModelId ? getModelConfig(thinkingModelId) : null;

  // Calculate if pending damage would kill (for flashing)
  const leftWillDie = leftArcher && pendingDamage.left >= leftArcher.health;
  const rightWillDie = rightArcher && pendingDamage.right >= rightArcher.health;

  // Health bar component with pending damage visualization
  const HealthBar = ({
    health,
    pending,
    willDie,
    color,
    reverse = false
  }: {
    health: number;
    pending: number;
    willDie: boolean;
    color: string;
    reverse?: boolean;
  }) => {
    const bars = [0, 1].map((i) => {
      const isActive = i < health;
      const isPendingDamage = isActive && i >= (health - pending);

      return (
        <div
          key={i}
          className={`w-6 h-2 rounded-sm transition-all duration-300 ${
            isPendingDamage
              ? `bg-red-500 ${willDie ? 'animate-pulse' : ''}`
              : isActive
                ? ''
                : 'bg-white/10'
          }`}
          style={{
            backgroundColor: isActive && !isPendingDamage ? color : undefined,
            opacity: isActive && !isPendingDamage ? 0.9 : undefined,
          }}
        />
      );
    });

    return (
      <div className={`flex items-center gap-1 ${reverse ? 'flex-row-reverse' : ''}`}>
        {bars}
      </div>
    );
  };

  return (
    <>
      {/* Top bar - VS display and match info */}
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Back button - left aligned */}
        <div className="flex justify-start">
          <button
            onClick={backToMenu}
            className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white rounded-xl transition-all font-medium"
          >
            Menu
          </button>
        </div>

        {/* Center - VS Display - truly centered */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4 md:gap-6 bg-black/60 backdrop-blur-md rounded-2xl px-4 md:px-6 py-3">
          {/* Left Archer */}
          {leftConfig && (
            <div className={`flex items-center gap-2 md:gap-3 transition-all ${currentTurn === 'left' && phase !== 'finished' ? 'scale-105' : ''}`}>
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-shadow"
                style={{
                  backgroundColor: `${leftConfig.color}30`,
                  boxShadow: currentTurn === 'left' && phase !== 'finished' ? `0 0 20px ${leftConfig.color}60` : 'none',
                }}
              >
                {leftConfig.icon}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-white font-semibold text-sm">{leftConfig.name}</div>
                <HealthBar
                  health={leftArcher?.health ?? 0}
                  pending={pendingDamage.left}
                  willDie={!!leftWillDie}
                  color={leftConfig.color}
                />
              </div>
            </div>
          )}

          {/* VS */}
          <div className="text-xl md:text-2xl font-black text-amber-400">VS</div>

          {/* Right Archer */}
          {rightConfig && (
            <div className={`flex items-center gap-2 md:gap-3 transition-all ${currentTurn === 'right' && phase !== 'finished' ? 'scale-105' : ''}`}>
              <div className="hidden sm:block text-right">
                <div className="text-white font-semibold text-sm">{rightConfig.name}</div>
                <HealthBar
                  health={rightArcher?.health ?? 0}
                  pending={pendingDamage.right}
                  willDie={!!rightWillDie}
                  color={rightConfig.color}
                  reverse
                />
              </div>
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl transition-shadow"
                style={{
                  backgroundColor: `${rightConfig.color}30`,
                  boxShadow: currentTurn === 'right' && phase !== 'finished' ? `0 0 20px ${rightConfig.color}60` : 'none',
                }}
              >
                {rightConfig.icon}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Match info - right aligned (hidden on mobile) */}
        <div className="hidden md:flex justify-end">
          <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 text-sm">
            {matchSetup && (
              <div>
                <div className="font-bold text-white">
                  Round {roundNumber}/15
                  {shotsThisRound > 0 && <span className="text-white/50 font-normal ml-1">({shotsThisRound}/2)</span>}
                </div>
                <div className="text-xs text-white/60">
                  {matchSetup.distance}m | {matchSetup.wind.speed > 0 ? `${matchSetup.wind.speed}m/s ${matchSetup.wind.direction === 'left' ? '←' : '→'}` : 'No wind'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thinking bubble - white speech bubble with black outline */}
      {isThinking && thinkingConfig && (
        <div className="flex justify-center mt-2 relative z-40">
          <div
            className={`relative transition-transform duration-200 ${
              currentTurn === 'left' ? '-translate-x-16 md:-translate-x-24' : 'translate-x-16 md:translate-x-24'
            }`}
          >
            {/* Bubble tail pointing up */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-l-2 border-t-2 border-black/80" />
            {/* Bubble content */}
            <div className="relative bg-white rounded-2xl px-4 py-2 flex items-center gap-2 border-2 border-black/80 shadow-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-800 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-800 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-800 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-gray-800 text-sm font-semibold">Thinking...</span>
            </div>
          </div>
        </div>
      )}

      {/* Centered status area - arrow in flight, results */}
      {(phase === 'shooting' || (phase === 'result' && lastHitResult)) && (
        <div className="flex justify-center mt-2">
          {/* Arrow in flight indicator - simple dark style */}
          {phase === 'shooting' && (
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 font-medium text-sm border border-white/10">
              Arrow in flight...
            </div>
          )}

          {/* Result indicators */}
          {phase === 'result' && lastHitResult && (
            <>
              {lastHitResult.type === 'headshot' && (
                <div className="relative">
                  <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white text-2xl md:text-3xl font-black px-8 py-3 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-pulse">
                    HEADSHOT!
                  </div>
                  <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-xl -z-10 animate-ping" />
                </div>
              )}
              {lastHitResult.type === 'body' && (
                <div className="relative">
                  <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-2xl md:text-3xl font-black px-8 py-3 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.6)]">
                    HIT!
                  </div>
                  <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-lg -z-10" />
                </div>
              )}
              {lastHitResult.type === 'miss' && (
                <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white/60 font-medium text-sm border border-white/10">
                  Miss
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Duel rules popup - simple dark style */}
      {phase === 'result' && firstShotWouldKill && shotsThisRound === 1 && (
        <div className="flex justify-center mt-3">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
            <div className="text-xs text-white/60 font-medium">A true duel demands honor — the wounded archer draws their final arrow</div>
          </div>
        </div>
      )}

      {/* Center status overlays */}
      {/* Intro uses 3D text rendered in Three.js scene - no HTML overlay needed */}

      {/* Winner announcement */}
      {phase === 'finished' && winnerConfig && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/60 backdrop-blur-sm">
          <div
            className="backdrop-blur-md rounded-3xl px-12 py-10 text-center"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.95))',
              boxShadow: `0 0 80px ${winnerConfig.color}40, 0 0 120px rgba(251,191,36,0.2)`
            }}
          >
            <div
              className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center text-6xl"
              style={{
                backgroundColor: `${winnerConfig.color}30`,
                boxShadow: `0 0 40px ${winnerConfig.color}50`
              }}
            >
              {winnerConfig.icon}
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-amber-400 mb-2 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              VICTORY!
            </h2>
            <div className="text-2xl md:text-3xl text-white font-bold mb-3">{winnerConfig.name}</div>
            <div className="text-lg text-white/60">
              {winReason === 'headshot' && 'Headshot! Instant kill!'}
              {winReason === 'bodyshot' && 'Victory by elimination!'}
              {winReason === 'timeout' && 'Most damage after time limit!'}
            </div>
            <div className="mt-8 flex flex-col gap-3 items-center">
              <button
                onClick={selectRandomModels}
                className="w-full px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-xl transition-all pointer-events-auto shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
              >
                AGAIN!
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetailsModal(true)}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl transition-all pointer-events-auto hover:scale-105 active:scale-95"
                >
                  View Details
                </button>
                <button
                  onClick={backToMenu}
                  className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg rounded-xl transition-all pointer-events-auto shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tie announcement */}
      {phase === 'finished' && winReason === 'tie' && !winner && (() => {
        // Determine the type of tie
        const bothDead = leftArcher?.health === 0 && rightArcher?.health === 0;
        const bothFullHealth = leftArcher?.health === 2 && rightArcher?.health === 2;
        const bothAlive = (leftArcher?.health ?? 0) > 0 && (rightArcher?.health ?? 0) > 0;

        let title = 'DRAW!';
        let subtitle = '';
        let description = '';

        if (bothDead) {
          title = 'MUTUAL DEFEAT!';
          subtitle = 'Both archers fall in the same round!';
          description = 'A true test of skill — neither could best the other';
        } else if (bothFullHealth) {
          title = 'STALEMATE!';
          subtitle = 'Neither archer landed a single hit!';
          description = 'Perhaps they need glasses?';
        } else if (bothAlive) {
          title = 'DRAW!';
          subtitle = 'Time ran out with equal damage!';
          description = 'An evenly matched duel';
        }

        return (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/60 backdrop-blur-sm">
            <div
              className="backdrop-blur-md rounded-3xl px-12 py-10 text-center"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.95))',
                boxShadow: '0 0 80px rgba(168,85,247,0.3)'
              }}
            >
              <div className="flex justify-center gap-4 mb-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{
                    backgroundColor: `${leftConfig?.color}30`,
                    boxShadow: `0 0 30px ${leftConfig?.color}40`
                  }}
                >
                  {leftConfig?.icon}
                </div>
                <div className="flex items-center text-2xl text-white/40">vs</div>
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{
                    backgroundColor: `${rightConfig?.color}30`,
                    boxShadow: `0 0 30px ${rightConfig?.color}40`
                  }}
                >
                  {rightConfig?.icon}
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-purple-400 mb-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                {title}
              </h2>
              <div className="text-xl text-white font-bold mb-3">
                {leftConfig?.name} & {rightConfig?.name}
              </div>
              <div className="text-lg text-white/60">
                {subtitle}
              </div>
              <div className="text-sm text-purple-300 mt-2">
                {description}
              </div>
              <div className="mt-8 flex flex-col gap-3 items-center">
                <button
                  onClick={selectRandomModels}
                  className="w-full px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-2xl rounded-xl transition-all pointer-events-auto shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
                >
                  AGAIN!
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl transition-all pointer-events-auto hover:scale-105 active:scale-95"
                  >
                    View Details
                  </button>
                  <button
                    onClick={backToMenu}
                    className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg rounded-xl transition-all pointer-events-auto shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Match Details Modal */}
      <MatchDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
}
