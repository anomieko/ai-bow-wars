/**
 * Game state management using Zustand
 */

import { create } from 'zustand';
import {
  GameState,
  GamePhase,
  Archer,
  MatchSetup,
  Turn,
  Shot,
  HitResult,
  Vector2,
  GAME_CONSTANTS,
} from '@/types/game';
import { generateMatchSetup } from './physics';
import { MODELS } from '@/config/models';

// Extended phases to include menu states
export type AppScreen = 'menu' | 'custom-select' | 'leaderboard' | 'info' | 'game';

// Camera modes for cinematic experience
export type CameraMode = 'intro' | 'left-archer' | 'right-archer' | 'follow-arrow' | 'result' | 'overview';

interface GameStore extends GameState {
  // App navigation
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  // Camera
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  // Actions
  selectModels: (leftModelId: string, rightModelId: string) => void;
  selectRandomModels: () => void;
  startMatch: () => void;
  setPhase: (phase: GamePhase) => void;
  executeShot: (shot: Shot, arrowPath: Vector2[], result: HitResult) => void;
  nextTurn: () => void;
  endMatch: (winner: string, reason: 'headshot' | 'bodyshot' | 'timeout') => void;
  resetGame: () => void;
  backToMenu: () => void;

  // Current arrow animation state
  currentArrowPath: Vector2[] | null;
  setCurrentArrowPath: (path: Vector2[] | null) => void;

  // Thinking state
  thinkingModelId: string | null;
  setThinkingModelId: (modelId: string | null) => void;

  // Last hit result for effects
  lastHitResult: HitResult | null;
  setLastHitResult: (result: HitResult | null) => void;
}

const initialState: GameState = {
  phase: 'setup',
  matchSetup: null,
  leftArcher: null,
  rightArcher: null,
  currentTurn: 'left',
  turnNumber: 0,
  turns: [],
  winner: null,
  winReason: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  screen: 'menu',
  cameraMode: 'overview',
  currentArrowPath: null,
  thinkingModelId: null,
  lastHitResult: null,

  setScreen: (screen: AppScreen) => {
    set({ screen });
  },

  setCameraMode: (mode: CameraMode) => {
    set({ cameraMode: mode });
  },

  selectModels: (leftModelId: string, rightModelId: string) => {
    const setup = generateMatchSetup();

    const matchSetup: MatchSetup = {
      id: crypto.randomUUID(),
      ...setup,
      createdAt: new Date().toISOString(),
    };

    const leftArcher: Archer = {
      modelId: leftModelId,
      position: { x: 0, y: setup.leftArcherY },
      health: GAME_CONSTANTS.MAX_HEALTH,
      side: 'left',
    };

    const rightArcher: Archer = {
      modelId: rightModelId,
      position: { x: setup.distance, y: setup.rightArcherY },
      health: GAME_CONSTANTS.MAX_HEALTH,
      side: 'right',
    };

    set({
      matchSetup,
      leftArcher,
      rightArcher,
      phase: 'ready',
      turnNumber: 0,
      turns: [],
      currentTurn: 'left',
      winner: null,
      winReason: null,
      screen: 'game',
      cameraMode: 'intro',
      lastHitResult: null,
    });
  },

  selectRandomModels: () => {
    // Pick two random different models
    const shuffled = [...MODELS].sort(() => Math.random() - 0.5);
    const leftModel = shuffled[0];
    const rightModel = shuffled[1];

    get().selectModels(leftModel.id, rightModel.id);
  },

  startMatch: () => {
    set({
      phase: 'thinking',
      turnNumber: 1,
      currentTurn: 'left',
      cameraMode: 'left-archer',
    });
  },

  setPhase: (phase: GamePhase) => {
    set({ phase });
  },

  executeShot: (shot: Shot, arrowPath: Vector2[], result: HitResult) => {
    const state = get();
    const currentArcher = state.currentTurn === 'left' ? state.leftArcher : state.rightArcher;
    const targetArcher = state.currentTurn === 'left' ? state.rightArcher : state.leftArcher;

    if (!currentArcher || !targetArcher) return;

    const turn: Turn = {
      turnNumber: state.turnNumber,
      modelId: currentArcher.modelId,
      shot,
      result,
      arrowPath,
      timestamp: new Date().toISOString(),
    };

    // Update health if hit
    let updatedTargetHealth = targetArcher.health;
    if (result.type === 'headshot') {
      updatedTargetHealth = 0;
    } else if (result.type === 'body') {
      updatedTargetHealth -= 1;
    }

    const updatedTarget: Archer = {
      ...targetArcher,
      health: updatedTargetHealth,
    };

    set({
      turns: [...state.turns, turn],
      lastHitResult: result,
      ...(state.currentTurn === 'left'
        ? { rightArcher: updatedTarget }
        : { leftArcher: updatedTarget }),
    });
  },

  nextTurn: () => {
    const state = get();
    const targetArcher = state.currentTurn === 'left' ? state.rightArcher : state.leftArcher;
    const currentArcher = state.currentTurn === 'left' ? state.leftArcher : state.rightArcher;

    if (!targetArcher || !currentArcher) return;

    // Check if target is dead
    if (targetArcher.health <= 0) {
      const lastTurn = state.turns[state.turns.length - 1];
      const winReason = lastTurn?.result.type === 'headshot' ? 'headshot' : 'bodyshot';
      get().endMatch(currentArcher.modelId, winReason);
      return;
    }

    // Check turn limit
    if (state.turnNumber >= GAME_CONSTANTS.MAX_TURNS) {
      const leftHealth = state.leftArcher?.health ?? 0;
      const rightHealth = state.rightArcher?.health ?? 0;

      if (leftHealth > rightHealth) {
        get().endMatch(state.leftArcher!.modelId, 'timeout');
      } else if (rightHealth > leftHealth) {
        get().endMatch(state.rightArcher!.modelId, 'timeout');
      } else {
        get().endMatch(state.leftArcher!.modelId, 'timeout');
      }
      return;
    }

    // Switch turns
    const nextTurnSide = state.currentTurn === 'left' ? 'right' : 'left';
    const nextTurnNumber = nextTurnSide === 'left' ? state.turnNumber + 1 : state.turnNumber;

    set({
      currentTurn: nextTurnSide,
      turnNumber: nextTurnNumber,
      phase: 'thinking',
      cameraMode: nextTurnSide === 'left' ? 'left-archer' : 'right-archer',
      lastHitResult: null,
    });
  },

  endMatch: (winner: string, reason: 'headshot' | 'bodyshot' | 'timeout') => {
    const state = get();

    set({
      winner,
      winReason: reason,
      phase: 'finished',
      cameraMode: 'overview',
    });

    // Record match to leaderboard (async, don't wait)
    const loser = winner === state.leftArcher?.modelId
      ? state.rightArcher?.modelId
      : state.leftArcher?.modelId;

    if (loser && state.matchSetup) {
      // Count shots per player
      const winnerShots = state.turns.filter(t => t.modelId === winner).length;
      const loserShots = state.turns.filter(t => t.modelId === loser).length;

      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winner,
          loserId: loser,
          winReason: reason,
          winnerShots,
          loserShots,
          distance: state.matchSetup.distance,
          windSpeed: state.matchSetup.wind.speed,
          windDirection: state.matchSetup.wind.direction,
        }),
      }).catch(err => {
        console.error('Failed to record match:', err);
      });
    }
  },

  resetGame: () => {
    set({
      ...initialState,
      screen: 'game',
      cameraMode: 'intro',
      currentArrowPath: null,
      thinkingModelId: null,
      lastHitResult: null,
    });
  },

  backToMenu: () => {
    set({
      ...initialState,
      screen: 'menu',
      cameraMode: 'overview',
      currentArrowPath: null,
      thinkingModelId: null,
      lastHitResult: null,
    });
  },

  setCurrentArrowPath: (path: Vector2[] | null) => {
    set({ currentArrowPath: path });
  },

  setThinkingModelId: (modelId: string | null) => {
    set({ thinkingModelId: modelId });
  },

  setLastHitResult: (result: HitResult | null) => {
    set({ lastHitResult: result });
  },
}));

// Helper hook to get current archer info
export function useCurrentArcher() {
  const { currentTurn, leftArcher, rightArcher } = useGameStore();
  return currentTurn === 'left' ? leftArcher : rightArcher;
}

// Helper hook to get target archer info
export function useTargetArcher() {
  const { currentTurn, leftArcher, rightArcher } = useGameStore();
  return currentTurn === 'left' ? rightArcher : leftArcher;
}
