'use client';

/**
 * Main game menu - Bowman style
 */

import { useEffect, useState } from 'react';
import { MODELS } from '@/config/models';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black mb-2">
          <span className="text-yellow-500">AI</span>{' '}
          <span className="text-white">BOW</span>{' '}
          <span className="text-red-500">WARS</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Watch AI models battle in archery combat
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-8 h-0.5 bg-yellow-500"></div>
          <span className="text-yellow-500 text-sm">POWERED BY VERCEL AI GATEWAY</span>
          <div className="w-8 h-0.5 bg-yellow-500"></div>
        </div>

        {/* Mock mode indicator */}
        {isMockMode && (
          <div className="mt-4 px-4 py-2 bg-yellow-900/50 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-xs">
              Test Mode - Results not saved to leaderboard
            </p>
          </div>
        )}
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-80">
        {/* Main Start Button */}
        <button
          onClick={onStartRandom}
          className="group relative py-6 px-8 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-2xl rounded-lg transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/30"
        >
          <span className="relative z-10">START</span>
          <span className="absolute bottom-2 right-4 text-xs text-green-200 opacity-70">
            Random AI vs AI
          </span>
        </button>

        {/* Custom Start */}
        <button
          onClick={onStartCustom}
          className="py-4 px-8 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-lg rounded-lg transition-all transform hover:scale-102"
        >
          START (Custom)
          <span className="block text-xs text-gray-400 mt-1">Choose your contestants</span>
        </button>

        {/* Leaderboard */}
        <button
          onClick={onLeaderboard}
          className="py-4 px-8 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-lg rounded-lg transition-all transform hover:scale-102"
        >
          LEADERBOARD
          <span className="block text-xs text-gray-400 mt-1">See AI rankings</span>
        </button>

        {/* Info */}
        <button
          onClick={onInfo}
          className="py-4 px-8 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-lg rounded-lg transition-all transform hover:scale-102"
        >
          HOW TO PLAY
          <span className="block text-xs text-gray-400 mt-1">Learn the rules</span>
        </button>
      </div>

      {/* Model showcase */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm mb-3">Featuring {MODELS.length} AI models</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {MODELS.map((model) => (
            <span
              key={model.id}
              className="text-2xl"
              title={model.name}
            >
              {model.icon}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-gray-600 text-sm">
        Vercel AI Gateway Hackathon 2025
      </div>
    </div>
  );
}
