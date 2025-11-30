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
  StuckArrow,
  GAME_CONSTANTS,
} from '@/types/game';
import { generateMatchSetup } from './physics';
import { MODELS } from '@/config/models';

// Extended phases to include menu states
export type AppScreen = 'menu' | 'custom-select' | 'leaderboard' | 'info' | 'credits' | 'game';

// Camera modes for cinematic experience
export type CameraMode = 'intro' | 'left-archer' | 'right-archer' | 'follow-arrow' | 'result' | 'overview';

// Match type for leaderboard
export type MatchType = 'random' | 'custom';

interface GameStore extends GameState {
  // App navigation
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  // Camera
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  // Pause state - for handling alt-tab/visibility changes
  isPaused: boolean;
  setPaused: (paused: boolean) => void;

  // Match type (random vs custom) - only random affects ELO
  matchType: MatchType;

  // Actions
  selectModels: (leftModelId: string, rightModelId: string, matchType?: MatchType) => void;
  selectRandomModels: () => void;
  startMatch: () => void;
  setPhase: (phase: GamePhase) => void;
  executeShot: (shot: Shot, arrowPath: Vector2[], result: HitResult, prompt?: string, rawResponse?: string) => void;
  nextTurn: () => void;
  endMatch: (winner: string | null, reason: 'headshot' | 'bodyshot' | 'timeout' | 'tie') => void;
  cancelMatch: (reason: string) => void;
  resetGame: () => void;
  backToMenu: () => void;

  // Round-based system - track if first shot would have killed
  firstShotWouldKill: boolean;
  setFirstShotWouldKill: (value: boolean) => void;

  // Current arrow animation state
  currentArrowPath: Vector2[] | null;
  setCurrentArrowPath: (path: Vector2[] | null) => void;

  // Thinking state
  thinkingModelId: string | null;
  setThinkingModelId: (modelId: string | null) => void;

  // Last hit result for effects
  lastHitResult: HitResult | null;
  setLastHitResult: (result: HitResult | null) => void;

  // Stuck arrows that persist through the match
  stuckArrows: StuckArrow[];
  addStuckArrow: (arrow: StuckArrow) => void;
}

const initialState: GameState = {
  phase: 'setup',
  matchSetup: null,
  leftArcher: null,
  rightArcher: null,
  currentTurn: 'left',
  turnNumber: 0,
  roundNumber: 0,
  roundFirstShooter: 'left',
  shotsThisRound: 0,
  pendingDamage: {
    left: 0,
    right: 0,
    leftKillingBlow: null,
    rightKillingBlow: null,
  },
  turns: [],
  winner: null,
  winReason: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  screen: 'menu',
  cameraMode: 'overview',
  isPaused: false,
  matchType: 'random',
  currentArrowPath: null,
  thinkingModelId: null,
  lastHitResult: null,
  firstShotWouldKill: false,
  stuckArrows: [],

  setScreen: (screen: AppScreen) => {
    set({ screen });
  },

  setCameraMode: (mode: CameraMode) => {
    set({ cameraMode: mode });
  },

  setPaused: (paused: boolean) => {
    set({ isPaused: paused });
  },

  selectModels: (leftModelId: string, rightModelId: string, matchType: MatchType = 'custom') => {
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
      matchType,
      phase: 'ready',
      turnNumber: 0,
      roundNumber: 0,
      roundFirstShooter: 'left',
      shotsThisRound: 0,
      pendingDamage: { left: 0, right: 0, leftKillingBlow: null, rightKillingBlow: null },
      turns: [],
      currentTurn: 'left',
      winner: null,
      winReason: null,
      screen: 'game',
      cameraMode: 'intro',
      lastHitResult: null,
      firstShotWouldKill: false,
    });
  },

  selectRandomModels: () => {
    // Pick two random different models
    const shuffled = [...MODELS].sort(() => Math.random() - 0.5);
    const leftModel = shuffled[0];
    const rightModel = shuffled[1];

    // Random matchups are ranked (affect ELO)
    get().selectModels(leftModel.id, rightModel.id, 'random');
  },

  startMatch: () => {
    set({
      phase: 'thinking',
      turnNumber: 1,
      roundNumber: 1,
      roundFirstShooter: 'left',
      shotsThisRound: 0,
      currentTurn: 'left',
      cameraMode: 'left-archer',
      pendingDamage: { left: 0, right: 0, leftKillingBlow: null, rightKillingBlow: null },
      firstShotWouldKill: false,
    });
  },

  setPhase: (phase: GamePhase) => {
    set({ phase });
  },

  executeShot: (shot: Shot, arrowPath: Vector2[], result: HitResult, prompt?: string, rawResponse?: string) => {
    const state = get();
    const currentArcher = state.currentTurn === 'left' ? state.leftArcher : state.rightArcher;
    const targetArcher = state.currentTurn === 'left' ? state.rightArcher : state.leftArcher;
    const targetSide = state.currentTurn === 'left' ? 'right' : 'left';

    if (!currentArcher || !targetArcher) return;

    const turn: Turn = {
      turnNumber: state.turnNumber,
      modelId: currentArcher.modelId,
      shot,
      result,
      arrowPath,
      timestamp: new Date().toISOString(),
      prompt,
      rawResponse,
    };

    // Calculate damage to accumulate (NOT applied yet - applied at round end)
    let damage = 0;
    if (result.type === 'headshot') {
      damage = GAME_CONSTANTS.MAX_HEALTH; // Instant kill damage
    } else if (result.type === 'body') {
      damage = 1;
    }

    // Update pending damage
    const newPendingDamage = { ...state.pendingDamage };
    if (targetSide === 'left') {
      newPendingDamage.left += damage;
      if (newPendingDamage.left >= state.leftArcher!.health && !newPendingDamage.leftKillingBlow) {
        newPendingDamage.leftKillingBlow = result;
      }
    } else {
      newPendingDamage.right += damage;
      if (newPendingDamage.right >= state.rightArcher!.health && !newPendingDamage.rightKillingBlow) {
        newPendingDamage.rightKillingBlow = result;
      }
    }

    // Check if this is the first shot of the round and it would kill
    const isFirstShotOfRound = state.shotsThisRound === 0;
    const wouldKill = damage > 0 && (
      (targetSide === 'left' && newPendingDamage.left >= state.leftArcher!.health) ||
      (targetSide === 'right' && newPendingDamage.right >= state.rightArcher!.health)
    );

    set({
      turns: [...state.turns, turn],
      lastHitResult: result,
      shotsThisRound: state.shotsThisRound + 1,
      pendingDamage: newPendingDamage,
      firstShotWouldKill: isFirstShotOfRound && wouldKill,
    });
  },

  setFirstShotWouldKill: (value: boolean) => {
    set({ firstShotWouldKill: value });
  },

  nextTurn: () => {
    const state = get();

    if (!state.leftArcher || !state.rightArcher) return;

    // Round has 2 shots - check if we need second shot or round is complete
    if (state.shotsThisRound < 2) {
      // First shot done, now second archer shoots
      const secondShooter = state.roundFirstShooter === 'left' ? 'right' : 'left';

      set({
        currentTurn: secondShooter,
        turnNumber: state.turnNumber + 1,
        phase: 'thinking',
        cameraMode: secondShooter === 'left' ? 'left-archer' : 'right-archer',
        lastHitResult: null,
        thinkingModelId: null,
      });
      return;
    }

    // Round complete - apply pending damage
    const { pendingDamage } = state;
    const newLeftHealth = Math.max(0, state.leftArcher.health - pendingDamage.left);
    const newRightHealth = Math.max(0, state.rightArcher.health - pendingDamage.right);

    const leftDead = newLeftHealth <= 0;
    const rightDead = newRightHealth <= 0;

    // Update health
    set({
      leftArcher: { ...state.leftArcher, health: newLeftHealth },
      rightArcher: { ...state.rightArcher, health: newRightHealth },
    });

    // Check for match end
    if (leftDead && rightDead) {
      // TIE - both killed each other this round!
      get().endMatch(null, 'tie');
      return;
    }

    if (leftDead) {
      // Right wins
      const reason = pendingDamage.leftKillingBlow?.type === 'headshot' ? 'headshot' : 'bodyshot';
      get().endMatch(state.rightArcher.modelId, reason);
      return;
    }

    if (rightDead) {
      // Left wins
      const reason = pendingDamage.rightKillingBlow?.type === 'headshot' ? 'headshot' : 'bodyshot';
      get().endMatch(state.leftArcher.modelId, reason);
      return;
    }

    // Check round/turn limit (MAX_TURNS is total individual shots, so MAX_TURNS/2 rounds)
    const maxRounds = Math.floor(GAME_CONSTANTS.MAX_TURNS / 2);
    if (state.roundNumber >= maxRounds) {
      // Timeout - whoever has more health wins
      if (newLeftHealth > newRightHealth) {
        get().endMatch(state.leftArcher.modelId, 'timeout');
      } else if (newRightHealth > newLeftHealth) {
        get().endMatch(state.rightArcher.modelId, 'timeout');
      } else {
        // Equal health = tie
        get().endMatch(null, 'tie');
      }
      return;
    }

    // Start next round - alternate first shooter
    const nextFirstShooter = state.roundFirstShooter === 'left' ? 'right' : 'left';

    set({
      roundNumber: state.roundNumber + 1,
      roundFirstShooter: nextFirstShooter,
      shotsThisRound: 0,
      pendingDamage: { left: 0, right: 0, leftKillingBlow: null, rightKillingBlow: null },
      currentTurn: nextFirstShooter,
      turnNumber: state.turnNumber + 1,
      phase: 'thinking',
      cameraMode: nextFirstShooter === 'left' ? 'left-archer' : 'right-archer',
      lastHitResult: null,
      firstShotWouldKill: false,
      thinkingModelId: null,
    });
  },

  endMatch: (winner: string | null, reason: 'headshot' | 'bodyshot' | 'timeout' | 'tie') => {
    const state = get();

    set({
      winner,
      winReason: reason,
      phase: 'finished',
      cameraMode: 'overview',
    });

    // Record match to leaderboard (async with timeout, don't block game)
    if (state.matchSetup && state.leftArcher && state.rightArcher) {
      const leftShots = state.turns.filter(t => t.modelId === state.leftArcher!.modelId).length;
      const rightShots = state.turns.filter(t => t.modelId === state.rightArcher!.modelId).length;
      const matchType = state.matchType; // 'random' or 'custom'

      // Helper to fetch with timeout
      const fetchWithTimeout = async (body: object) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        try {
          await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            console.warn('Leaderboard save timed out (5s)');
          } else {
            console.error('Failed to record match:', err);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      };

      if (reason === 'tie') {
        // Tie - record both participants
        fetchWithTimeout({
          winnerId: null,
          loserId: null,
          leftModelId: state.leftArcher.modelId,
          rightModelId: state.rightArcher.modelId,
          winReason: 'tie',
          winnerShots: leftShots,
          loserShots: rightShots,
          distance: state.matchSetup.distance,
          windSpeed: state.matchSetup.wind.speed,
          windDirection: state.matchSetup.wind.direction,
          matchType,
        });
      } else {
        // Normal win
        const loser = winner === state.leftArcher.modelId
          ? state.rightArcher.modelId
          : state.leftArcher.modelId;
        const winnerShots = state.turns.filter(t => t.modelId === winner).length;
        const loserShots = state.turns.filter(t => t.modelId === loser).length;

        fetchWithTimeout({
          winnerId: winner,
          loserId: loser,
          winReason: reason,
          winnerShots,
          loserShots,
          distance: state.matchSetup.distance,
          windSpeed: state.matchSetup.wind.speed,
          windDirection: state.matchSetup.wind.direction,
          matchType,
        });
      }
    }
  },

  cancelMatch: (reason: string) => {
    console.warn('Match cancelled:', reason);
    set({
      ...initialState,
      screen: 'menu',
      cameraMode: 'overview',
      currentArrowPath: null,
      thinkingModelId: null,
      lastHitResult: null,
      firstShotWouldKill: false,
      stuckArrows: [],
    });
    // Show alert to user (non-blocking)
    setTimeout(() => {
      alert(`Match cancelled: ${reason}`);
    }, 100);
  },

  resetGame: () => {
    set({
      ...initialState,
      screen: 'game',
      cameraMode: 'intro',
      currentArrowPath: null,
      thinkingModelId: null,
      lastHitResult: null,
      firstShotWouldKill: false,
      stuckArrows: [],
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
      firstShotWouldKill: false,
      stuckArrows: [],
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

  addStuckArrow: (arrow: StuckArrow) => {
    set((state) => ({ stuckArrows: [...state.stuckArrows, arrow] }));
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
