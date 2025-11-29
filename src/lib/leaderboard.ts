/**
 * Leaderboard data management using Vercel KV
 * Uses ELO rating system for proper competitive ranking
 */

import { kv } from '@vercel/kv';
import { MODELS } from '@/config/models';

// ELO constants
const STARTING_ELO = 1000;
const K_FACTOR = 32; // Standard K-factor for competitive games
const MIN_GAMES_FOR_RANKING = 3; // Minimum games to appear in rankings

// Types
export interface ModelStats {
  modelId: string;
  elo: number;           // ELO rating (only from ranked/random matches)
  wins: number;          // Total wins (ranked only)
  losses: number;        // Total losses (ranked only)
  ties: number;          // Total ties (ranked only)
  headshots: number;     // Headshot wins
  bodyshots: number;     // Bodyshot wins
  totalShots: number;    // Total arrows fired
  rankedGames: number;   // Number of ranked games played
}

export interface MatchRecord {
  id: string;
  timestamp: string;
  winnerId: string | null;      // null for ties
  loserId: string | null;       // null for ties
  leftModelId?: string;         // For ties
  rightModelId?: string;        // For ties
  winReason: 'headshot' | 'bodyshot' | 'timeout' | 'tie';
  winnerShots: number;
  loserShots: number;
  distance: number;
  windSpeed: number;
  windDirection: 'left' | 'right';
  matchType: 'random' | 'custom';  // Only random matches affect ELO
}

/**
 * Calculate expected score for ELO
 * E = 1 / (1 + 10^((Rb - Ra)/400))
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO rating
 * R' = R + K * (S - E)
 * S = 1 for win, 0.5 for tie, 0 for loss
 */
function calculateNewElo(currentRating: number, opponentRating: number, score: number): number {
  const expected = expectedScore(currentRating, opponentRating);
  return Math.round(currentRating + K_FACTOR * (score - expected));
}

export interface LeaderboardData {
  stats: Record<string, ModelStats>;
  recentMatches: MatchRecord[];
  totalMatches: number;
}

// Keys
const STATS_KEY = 'leaderboard:stats';
const MATCHES_KEY = 'leaderboard:matches';
const TOTAL_KEY = 'leaderboard:total';

/**
 * Create default stats for a model
 */
function createDefaultStats(modelId: string): ModelStats {
  return {
    modelId,
    elo: STARTING_ELO,
    wins: 0,
    losses: 0,
    ties: 0,
    headshots: 0,
    bodyshots: 0,
    totalShots: 0,
    rankedGames: 0,
  };
}

/**
 * Migrate old stats format to new format with ELO
 */
function migrateStats(stats: Partial<ModelStats> & { modelId: string }): ModelStats {
  return {
    modelId: stats.modelId,
    elo: stats.elo ?? STARTING_ELO,
    wins: stats.wins ?? 0,
    losses: stats.losses ?? 0,
    ties: stats.ties ?? 0,
    headshots: stats.headshots ?? 0,
    bodyshots: stats.bodyshots ?? 0,
    totalShots: stats.totalShots ?? 0,
    rankedGames: stats.rankedGames ?? (stats.wins ?? 0) + (stats.losses ?? 0) + (stats.ties ?? 0),
  };
}

/**
 * Get current leaderboard data
 */
export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const [stats, matches, total] = await Promise.all([
      kv.get<Record<string, ModelStats>>(STATS_KEY),
      kv.lrange<MatchRecord>(MATCHES_KEY, 0, 19), // Last 20 matches
      kv.get<number>(TOTAL_KEY),
    ]);

    // Initialize stats for all models, migrating old format if needed
    const allStats: Record<string, ModelStats> = {};
    for (const model of MODELS) {
      if (stats?.[model.id]) {
        allStats[model.id] = migrateStats(stats[model.id]);
      } else {
        allStats[model.id] = createDefaultStats(model.id);
      }
    }

    return {
      stats: allStats,
      recentMatches: matches || [],
      totalMatches: total || 0,
    };
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    // Return empty data on error
    const emptyStats: Record<string, ModelStats> = {};
    for (const model of MODELS) {
      emptyStats[model.id] = createDefaultStats(model.id);
    }
    return {
      stats: emptyStats,
      recentMatches: [],
      totalMatches: 0,
    };
  }
}

// Export for UI
export { MIN_GAMES_FOR_RANKING };

/**
 * Record a match result
 * Only random matches affect ELO ratings
 */
export async function recordMatch(match: Omit<MatchRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    const matchRecord: MatchRecord = {
      ...match,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Get current stats
    const rawStats = await kv.get<Record<string, ModelStats>>(STATS_KEY) || {};
    const currentStats: Record<string, ModelStats> = {};

    // Helper to get or initialize stats for a model
    const getStats = (modelId: string): ModelStats => {
      if (!currentStats[modelId]) {
        currentStats[modelId] = rawStats[modelId]
          ? migrateStats(rawStats[modelId])
          : createDefaultStats(modelId);
      }
      return currentStats[modelId];
    };

    const isRanked = match.matchType === 'random';

    if (match.winReason === 'tie') {
      // Handle tie - both models get a tie recorded
      const leftModel = match.leftModelId!;
      const rightModel = match.rightModelId!;

      const leftStats = getStats(leftModel);
      const rightStats = getStats(rightModel);

      // Always update shot count
      leftStats.totalShots += match.winnerShots;
      rightStats.totalShots += match.loserShots;

      // Only update ELO and ranked stats for random matches
      if (isRanked) {
        // ELO for tie: both get 0.5 score
        const leftNewElo = calculateNewElo(leftStats.elo, rightStats.elo, 0.5);
        const rightNewElo = calculateNewElo(rightStats.elo, leftStats.elo, 0.5);

        leftStats.elo = leftNewElo;
        rightStats.elo = rightNewElo;
        leftStats.ties += 1;
        rightStats.ties += 1;
        leftStats.rankedGames += 1;
        rightStats.rankedGames += 1;
      }
    } else {
      // Normal win/loss
      const winnerStats = getStats(match.winnerId!);
      const loserStats = getStats(match.loserId!);

      // Always update shot count
      winnerStats.totalShots += match.winnerShots;
      loserStats.totalShots += match.loserShots;

      // Only update ELO and ranked stats for random matches
      if (isRanked) {
        // ELO: winner gets 1, loser gets 0
        const winnerNewElo = calculateNewElo(winnerStats.elo, loserStats.elo, 1);
        const loserNewElo = calculateNewElo(loserStats.elo, winnerStats.elo, 0);

        winnerStats.elo = winnerNewElo;
        loserStats.elo = loserNewElo;
        winnerStats.wins += 1;
        loserStats.losses += 1;
        winnerStats.rankedGames += 1;
        loserStats.rankedGames += 1;

        if (match.winReason === 'headshot') {
          winnerStats.headshots += 1;
        } else if (match.winReason === 'bodyshot') {
          winnerStats.bodyshots += 1;
        }
      }
    }

    // Merge with existing stats (preserve models not in this match)
    const mergedStats = { ...rawStats };
    for (const [modelId, stats] of Object.entries(currentStats)) {
      mergedStats[modelId] = stats;
    }

    // Save everything
    await Promise.all([
      kv.set(STATS_KEY, mergedStats),
      kv.lpush(MATCHES_KEY, matchRecord),
      kv.incr(TOTAL_KEY),
      // Trim matches list to last 100
      kv.ltrim(MATCHES_KEY, 0, 99),
    ]);
  } catch (error) {
    console.error('Failed to record match:', error);
    throw error;
  }
}

/**
 * Check if we should record matches (only in production with real API)
 */
export function shouldRecordMatches(): boolean {
  return process.env.MOCK_AI !== 'true' && !!process.env.KV_REST_API_URL;
}
