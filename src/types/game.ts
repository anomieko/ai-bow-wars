/**
 * Core game types for AI Bow Wars
 */

// === Position & Physics ===

export interface Vector2 {
  x: number;
  y: number;
}

export interface Wind {
  speed: number;           // 0-15 m/s
  direction: 'left' | 'right';
}

// === Match Setup ===

export interface MatchSetup {
  id: string;
  distance: number;        // 80-120 meters between archers
  leftArcherY: number;     // Height offset for left archer (-5 to +5)
  rightArcherY: number;    // Height offset for right archer (-5 to +5)
  wind: Wind;
  createdAt: string;
}

// === Archer & Player ===

export interface Archer {
  modelId: string;         // e.g., "anthropic/claude-sonnet-4.5"
  position: Vector2;
  health: number;          // 2 = full, 1 = one body hit, 0 = dead
  side: 'left' | 'right';
}

// === Shots & Turns ===

export interface Shot {
  angle: number;           // 0-90 degrees
  power: number;           // 0-100 percent
  reasoning?: string;      // AI's explanation
}

export type HitResult =
  | { type: 'miss'; distanceX: number; distanceY: number; fellShort?: boolean }
  | { type: 'body' }
  | { type: 'headshot' };

// Stuck arrow that persists after shot
export interface StuckArrow {
  id: string;
  position: Vector2;
  angle: number;          // Rotation in radians
  modelId: string;        // For coloring
  stuckIn: 'ground' | 'body' | 'head';
  targetSide?: 'left' | 'right';  // If stuck in archer
}

export interface Turn {
  turnNumber: number;
  modelId: string;
  shot: Shot;
  result: HitResult;
  arrowPath: Vector2[];    // For animation
  timestamp: string;
  // Debug/analysis data
  prompt?: string;         // The prompt sent to the AI
  rawResponse?: string;    // Raw AI response before parsing
}

// === Game State ===

export type GamePhase =
  | 'setup'       // Selecting models
  | 'ready'       // Match ready to start
  | 'thinking'    // AI is generating shot
  | 'shooting'    // Arrow in flight
  | 'result'      // Showing shot result
  | 'finished';   // Match complete

export interface GameState {
  phase: GamePhase;
  matchSetup: MatchSetup | null;
  leftArcher: Archer | null;
  rightArcher: Archer | null;
  currentTurn: 'left' | 'right';
  turnNumber: number;
  roundNumber: number;           // Each round = both archers shoot once
  roundFirstShooter: 'left' | 'right';  // Alternates each round
  shotsThisRound: number;        // 0, 1, or 2 shots completed this round
  pendingDamage: {               // Damage to apply at end of round
    left: number;
    right: number;
    leftKillingBlow: HitResult | null;   // Track what killed them
    rightKillingBlow: HitResult | null;
  };
  turns: Turn[];
  winner: string | null;         // modelId of winner, or 'tie' for mutual kill
  winReason: 'headshot' | 'bodyshot' | 'timeout' | 'tie' | null;
}

// === AI Response ===

export interface AIResponse {
  reasoning: string;
  angle: number;
  power: number;
}

// === Leaderboard ===

export interface ModelStats {
  modelId: string;
  wins: number;
  losses: number;
  ties: number;              // Mutual kills
  headshots: number;
  bodyshots: number;
  totalShots: number;
  totalHits: number;
}

export interface MatchRecord {
  id: string;
  timestamp: string;
  winner: string | null;     // null for ties
  loser: string | null;      // null for ties
  leftModelId?: string;      // For ties, track both participants
  rightModelId?: string;
  winnerShots: number;
  loserShots: number;
  winReason: 'headshot' | 'bodyshot' | 'timeout' | 'tie';
  conditions: {
    distance: number;
    wind: number;
    windDirection: 'left' | 'right';
  };
}

export interface Leaderboard {
  models: Record<string, ModelStats>;
  recentMatches: MatchRecord[];
  totalMatches: number;
  lastUpdated: string;
}

// === Constants ===

export const GAME_CONSTANTS = {
  MAX_HEALTH: 2,
  MAX_TURNS: 30,
  MIN_DISTANCE: 80,
  MAX_DISTANCE: 120,
  MIN_HEIGHT_OFFSET: 0,    // Archers always on ground
  MAX_HEIGHT_OFFSET: 0,    // Archers always on ground
  MIN_WIND: 0,
  MAX_WIND: 15,
  GRAVITY: 9.81,
  MAX_VELOCITY: 50,        // m/s at 100% power
  HEAD_HITBOX_RADIUS: 0.5, // meters
  BODY_HITBOX_WIDTH: 1,    // meters
  BODY_HITBOX_HEIGHT: 1.5, // meters
} as const;
