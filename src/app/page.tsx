'use client';

import { Arena } from '@/components/game/Arena';
import { GameLoop } from '@/components/game/GameLoop';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { GameControls } from '@/components/ui/GameControls';
import { TurnLog } from '@/components/ui/TurnLog';
import { useGameStore } from '@/lib/game-store';

export default function Home() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="text-yellow-500">AI</span> Bow Wars
          </h1>
          <div className="text-sm text-gray-400">
            Powered by Vercel AI Gateway
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {phase === 'setup' ? (
          // Model selection screen
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">
                AI Archery Showdown
              </h2>
              <p className="text-gray-400 text-lg">
                Watch AI models battle it out in turn-based archery combat.
                Each model calculates angle and power to hit their opponent.
              </p>
            </div>
            <ModelSelector />
          </div>
        ) : (
          // Game screen
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Arena - takes up 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <Arena />
              <GameControls />
            </div>

            {/* Turn log sidebar */}
            <div className="lg:col-span-1">
              <TurnLog />
            </div>
          </div>
        )}

        {/* Game loop handler */}
        <GameLoop />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Built for the Vercel AI Gateway Hackathon 2025
        </div>
      </footer>
    </div>
  );
}
