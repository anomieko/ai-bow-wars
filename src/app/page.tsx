'use client';

import { Arena } from '@/components/game/Arena';
import { GameLoop } from '@/components/game/GameLoop';
import { MainMenu } from '@/components/ui/MainMenu';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { GameControls } from '@/components/ui/GameControls';
import { TurnLog } from '@/components/ui/TurnLog';
import { InfoScreen } from '@/components/ui/InfoScreen';
import { LeaderboardScreen } from '@/components/ui/LeaderboardScreen';
import { CreditsScreen } from '@/components/ui/CreditsScreen';
import { DebugPanel } from '@/components/ui/DebugPanel';
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
        onCredits={() => setScreen('credits')}
      />
    );
  }

  // Custom model selection
  if (screen === 'custom-select') {
    return <ModelSelector />;
  }

  // Info screen
  if (screen === 'info') {
    return <InfoScreen onBack={() => setScreen('menu')} />;
  }

  // Leaderboard screen
  if (screen === 'leaderboard') {
    return <LeaderboardScreen onBack={() => setScreen('menu')} />;
  }

  // Credits screen
  if (screen === 'credits') {
    return <CreditsScreen onBack={() => setScreen('menu')} />;
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

        {/* Debug panel - only visible in mock/test mode */}
        <DebugPanel />

        {/* Game loop handler */}
        <GameLoop />
      </div>
    </div>
  );
}
