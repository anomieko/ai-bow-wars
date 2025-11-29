'use client';

/**
 * Game HUD overlay - shows match info, status, and controls
 */

import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';

export function GameControls() {
  const {
    phase,
    cameraMode,
    backToMenu,
    matchSetup,
    leftArcher,
    rightArcher,
    currentTurn,
    turnNumber,
    thinkingModelId,
    winner,
    winReason,
    lastHitResult,
  } = useGameStore();

  if (phase === 'setup') return null;

  const leftConfig = leftArcher ? getModelConfig(leftArcher.modelId) : null;
  const rightConfig = rightArcher ? getModelConfig(rightArcher.modelId) : null;
  const winnerConfig = winner ? getModelConfig(winner) : null;

  const isThinking = phase === 'thinking' && thinkingModelId;
  const thinkingConfig = thinkingModelId ? getModelConfig(thinkingModelId) : null;

  return (
    <>
      {/* Top bar - VS display and match info */}
      <div className="flex items-center justify-between">
        {/* Back button */}
        <button
          onClick={backToMenu}
          className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg backdrop-blur-sm transition-colors"
        >
          Menu
        </button>

        {/* Center - VS Display */}
        <div className="flex items-center gap-6 bg-gray-900/80 backdrop-blur-sm rounded-lg px-6 py-3">
          {/* Left Archer */}
          {leftConfig && (
            <div className={`flex items-center gap-3 ${currentTurn === 'left' && phase !== 'finished' ? 'ring-2 ring-yellow-500 rounded-lg p-2 -m-2' : ''}`}>
              <span className="text-3xl">{leftConfig.icon}</span>
              <div className="text-left">
                <div className="text-white font-bold">{leftConfig.name}</div>
                <div className="flex items-center gap-1">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-2 rounded-sm ${
                        i < (leftArcher?.health ?? 0) ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VS */}
          <div className="text-2xl font-black text-yellow-500">VS</div>

          {/* Right Archer */}
          {rightConfig && (
            <div className={`flex items-center gap-3 ${currentTurn === 'right' && phase !== 'finished' ? 'ring-2 ring-yellow-500 rounded-lg p-2 -m-2' : ''}`}>
              <div className="text-right">
                <div className="text-white font-bold">{rightConfig.name}</div>
                <div className="flex items-center gap-1 justify-end">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-2 rounded-sm ${
                        i < (rightArcher?.health ?? 0) ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-3xl">{rightConfig.icon}</span>
            </div>
          )}
        </div>

        {/* Match info */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
          {matchSetup && (
            <div className="text-gray-300">
              <div>Turn {turnNumber}/30</div>
              <div className="text-xs text-gray-500">
                {matchSetup.distance}m | Wind: {matchSetup.wind.speed}m/s {matchSetup.wind.direction === 'left' ? '←' : '→'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center status overlays */}
      {/* Intro */}
      {cameraMode === 'intro' && phase === 'ready' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-center">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              {leftConfig?.icon} {leftConfig?.name}
            </h2>
            <div className="text-5xl md:text-6xl text-yellow-500 font-black mb-6 animate-pulse">VS</div>
            <h2 className="text-5xl md:text-7xl font-black text-white" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              {rightConfig?.name} {rightConfig?.icon}
            </h2>
            <p className="text-xl text-gray-300 mt-10 animate-pulse">Match starting...</p>
          </div>
        </div>
      )}

      {/* Thinking indicator - shows AI is calculating */}
      {isThinking && thinkingConfig && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl px-10 py-8 text-center border border-gray-700">
            <div className="text-5xl mb-3">{thinkingConfig.icon}</div>
            <div className="text-2xl text-white font-bold">{thinkingConfig.name}</div>
            <div className="text-yellow-500 animate-pulse mt-3 text-lg">Aiming...</div>
            <div className="mt-4 flex justify-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Shot fired indicator - brief flash when arrow is released */}
      {phase === 'shooting' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-40">
          <div className="bg-orange-600/90 backdrop-blur-sm rounded-full px-6 py-2 text-white font-bold animate-pulse">
            Arrow in flight!
          </div>
        </div>
      )}

      {/* Result indicator - shows hit or miss */}
      {phase === 'result' && lastHitResult && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className={`text-center ${lastHitResult.type === 'miss' ? 'animate-pulse' : 'animate-bounce'}`}>
            {lastHitResult.type === 'headshot' && (
              <div className="bg-red-600 text-white text-4xl font-black px-10 py-5 rounded-2xl border-4 border-red-400">
                HEADSHOT!
              </div>
            )}
            {lastHitResult.type === 'body' && (
              <div className="bg-orange-500 text-white text-4xl font-black px-10 py-5 rounded-2xl border-4 border-orange-300">
                HIT!
              </div>
            )}
            {lastHitResult.type === 'miss' && (
              <div className="bg-gray-700 text-gray-300 text-3xl font-bold px-8 py-4 rounded-2xl">
                MISS
              </div>
            )}
          </div>
        </div>
      )}

      {/* Winner announcement */}
      {phase === 'finished' && winnerConfig && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl px-16 py-10 text-center border-2 border-yellow-500">
            <div className="text-7xl mb-4">{winnerConfig.icon}</div>
            <h2 className="text-5xl font-black text-yellow-500 mb-3">WINNER!</h2>
            <div className="text-3xl text-white font-bold mb-3">{winnerConfig.name}</div>
            <div className="text-xl text-gray-400">
              {winReason === 'headshot' && 'Headshot! Instant kill!'}
              {winReason === 'bodyshot' && 'Victory by elimination!'}
              {winReason === 'timeout' && 'Most damage after 30 turns!'}
            </div>
            <button
              onClick={backToMenu}
              className="mt-8 px-10 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-lg rounded-lg transition-colors pointer-events-auto"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
