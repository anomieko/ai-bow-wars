'use client';

import { Arena } from '@/components/game/Arena';
import { GameLoop } from '@/components/game/GameLoop';
import { MainMenu } from '@/components/ui/MainMenu';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { GameControls } from '@/components/ui/GameControls';
import { TurnLog } from '@/components/ui/TurnLog';
import { InfoScreen } from '@/components/ui/InfoScreen';
import { LeaderboardScreen } from '@/components/ui/LeaderboardScreen';
import { useGameStore } from '@/lib/game-store';

export default function Home() {
  const {
    screen,
    setScreen,
    selectRandomModels,
  } = useGameStore();

  // Main Menu
  if (screen === 'menu') {
    return (
      <MainMenu
        onStartRandom={() => {
          selectRandomModels();
        }}
        onStartCustom={() => setScreen('custom-select')}
        onLeaderboard={() => setScreen('leaderboard')}
        onInfo={() => setScreen('info')}
      />
    );
  }

  // Custom model selection
  if (screen === 'custom-select') {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setScreen('menu')}
            className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"
          >
            <span>←</span> Back to Menu
          </button>
          <ModelSelector />
        </div>
      </div>
    );
  }

  // Info screen
  if (screen === 'info') {
    return <InfoScreen onBack={() => setScreen('menu')} />;
  }

  // Leaderboard screen
  if (screen === 'leaderboard') {
    return <LeaderboardScreen onBack={() => setScreen('menu')} />;
  }

  // Game screen
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Main content - full screen arena */}
      <div className="relative w-full h-screen">
        {/* 3D Arena */}
        <Arena />

        {/* Overlay UI */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <GameControls />
        </div>

        {/* Turn log sidebar */}
        <div className="absolute top-20 right-4 w-80">
          <TurnLog />
        </div>

        {/* Game loop handler */}
        <GameLoop />
      </div>
    </div>
  );
}
