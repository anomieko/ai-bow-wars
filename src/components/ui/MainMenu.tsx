'use client';

/**
 * Main menu - 3D arena background with orbiting camera
 */

import { useEffect, useState } from 'react';
import { MODELS, getModelConfig } from '@/config/models';
import { MenuArena } from '@/components/game/MenuArena';

interface MainMenuProps {
  onStartRandom: () => void;
  onStartCustom: () => void;
  onLeaderboard: () => void;
  onInfo: () => void;
}

export function MainMenu({ onStartRandom, onStartCustom, onLeaderboard, onInfo }: MainMenuProps) {
  const [isMockMode, setIsMockMode] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkMode() {
      try {
        const res = await fetch('/api/leaderboard');
        const json = await res.json();
        setIsMockMode(json.mock === true || json.data === null);
      } catch {
        setIsMockMode(null);
      }
    }
    checkMode();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Arena background */}
      <MenuArena />

      {/* Vignette overlay for better text readability */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-3">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">AI BOW WARS</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium">
            Language models compete in physics-based archery
          </p>

          {isMockMode && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-yellow-200 text-sm font-medium">Test Mode</span>
            </div>
          )}
        </div>

        {/* Menu buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={onStartRandom}
            className="w-full group relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl px-6 py-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)]"
          >
            <span className="text-2xl font-bold block">Play</span>
            <span className="text-emerald-100 text-sm">Random matchup</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onStartCustom}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl px-4 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="font-semibold block">Custom</span>
              <span className="text-white/60 text-xs">Pick models</span>
            </button>
            <button
              onClick={onLeaderboard}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl px-4 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="font-semibold block">Rankings</span>
              <span className="text-white/60 text-xs">Leaderboard</span>
            </button>
          </div>

          <button
            onClick={onInfo}
            className="w-full text-white/50 hover:text-white/80 text-sm py-2 transition-colors"
          >
            About this evaluation
          </button>
        </div>

        {/* Model showcase */}
        <div className="mt-12 w-full max-w-2xl">
          <p className="text-center text-white/40 text-xs font-medium uppercase tracking-widest mb-4">
            {MODELS.length} AI Models
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {MODELS.map((model) => {
              const config = getModelConfig(model.id);
              return (
                <div
                  key={model.id}
                  className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 hover:bg-black/40 transition-colors"
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-xs font-medium text-white/80">{config.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Powered by badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <span>Powered by</span>
            <span className="font-semibold text-white/50">Vercel AI Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
