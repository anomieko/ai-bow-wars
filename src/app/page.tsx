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
import { PausedOverlay } from '@/components/ui/PausedOverlay';
import { MobileIntro } from '@/components/ui/MobileIntro';
import { MobileBattleLog } from '@/components/ui/MobileBattleLog';
import { useGameStore } from '@/lib/game-store';
import { useWakeLock } from '@/lib/use-wake-lock';

export default function Home() {
  const {
    screen,
    setScreen,
    selectRandomModels,
    isPaused,
    phase,
  } = useGameStore();

  // Keep screen awake during active matches (mobile only)
  // Active when in game screen and match is in progress (not setup or finished)
  const isMatchActive = screen === 'game' && phase !== 'setup' && phase !== 'finished';
  useWakeLock(isMatchActive);

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
    <div className={`min-h-screen bg-gray-950 text-white ${isPaused ? 'game-paused' : ''}`}>
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

        {/* Pause overlay - shown when user alt-tabs */}
        <PausedOverlay />

        {/* Mobile intro overlay - covers screen on phones during intro */}
        <MobileIntro />

        {/* Mobile battle log - bottom bar on phones */}
        <MobileBattleLog />
      </div>
    </div>
  );
}
