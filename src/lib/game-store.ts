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
import { generateMatchSetup, simulateArrow } from './physics';
import { getModelConfig } from '@/config/models';

interface GameStore extends GameState {
  // Actions
  selectModels: (leftModelId: string, rightModelId: string) => void;
  startMatch: () => void;
  setPhase: (phase: GamePhase) => void;
  executeShot: (shot: Shot, arrowPath: Vector2[], result: HitResult) => void;
  nextTurn: () => void;
  endMatch: (winner: string, reason: 'headshot' | 'bodyshot' | 'timeout') => void;
  resetGame: () => void;

  // Current arrow animation state
  currentArrowPath: Vector2[] | null;
  setCurrentArrowPath: (path: Vector2[] | null) => void;

  // Thinking state
  thinkingModelId: string | null;
  setThinkingModelId: (modelId: string | null) => void;
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
  currentArrowPath: null,
  thinkingModelId: null,

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
    });
  },

  startMatch: () => {
    set({
      phase: 'thinking',
      turnNumber: 1,
      currentTurn: 'left',
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
      // Determine winner by remaining health, then by who shot more accurately
      const leftHealth = state.leftArcher?.health ?? 0;
      const rightHealth = state.rightArcher?.health ?? 0;

      if (leftHealth > rightHealth) {
        get().endMatch(state.leftArcher!.modelId, 'timeout');
      } else if (rightHealth > leftHealth) {
        get().endMatch(state.rightArcher!.modelId, 'timeout');
      } else {
        // Tie - left wins by default (they went first)
        get().endMatch(state.leftArcher!.modelId, 'timeout');
      }
      return;
    }

    // Switch turns
    const nextTurn = state.currentTurn === 'left' ? 'right' : 'left';
    const nextTurnNumber = nextTurn === 'left' ? state.turnNumber + 1 : state.turnNumber;

    set({
      currentTurn: nextTurn,
      turnNumber: nextTurnNumber,
      phase: 'thinking',
    });
  },

  endMatch: (winner: string, reason: 'headshot' | 'bodyshot' | 'timeout') => {
    set({
      winner,
      winReason: reason,
      phase: 'finished',
    });
  },

  resetGame: () => {
    set({
      ...initialState,
      currentArrowPath: null,
      thinkingModelId: null,
    });
  },

  setCurrentArrowPath: (path: Vector2[] | null) => {
    set({ currentArrowPath: path });
  },

  setThinkingModelId: (modelId: string | null) => {
    set({ thinkingModelId: modelId });
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
