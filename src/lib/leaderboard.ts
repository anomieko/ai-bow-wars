/**
 * Leaderboard data management using Vercel KV
 */

import { kv } from '@vercel/kv';
import { MODELS } from '@/config/models';

// Types
export interface ModelStats {
  modelId: string;
  wins: number;
  losses: number;
  headshots: number;
  bodyshots: number;
  totalShots: number;
}

export interface MatchRecord {
  id: string;
  timestamp: string;
  winnerId: string;
  loserId: string;
  winReason: 'headshot' | 'bodyshot' | 'timeout';
  winnerShots: number;
  loserShots: number;
  distance: number;
  windSpeed: number;
  windDirection: 'left' | 'right';
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
 * Get current leaderboard data
 */
export async function getLeaderboard(): Promise<LeaderboardData> {
  try {
    const [stats, matches, total] = await Promise.all([
      kv.get<Record<string, ModelStats>>(STATS_KEY),
      kv.lrange<MatchRecord>(MATCHES_KEY, 0, 19), // Last 20 matches
      kv.get<number>(TOTAL_KEY),
    ]);

    // Initialize stats for all models if not exists
    const allStats: Record<string, ModelStats> = {};
    for (const model of MODELS) {
      allStats[model.id] = stats?.[model.id] || {
        modelId: model.id,
        wins: 0,
        losses: 0,
        headshots: 0,
        bodyshots: 0,
        totalShots: 0,
      };
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
      emptyStats[model.id] = {
        modelId: model.id,
        wins: 0,
        losses: 0,
        headshots: 0,
        bodyshots: 0,
        totalShots: 0,
      };
    }
    return {
      stats: emptyStats,
      recentMatches: [],
      totalMatches: 0,
    };
  }
}

/**
 * Record a match result
 */
export async function recordMatch(match: Omit<MatchRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    const matchRecord: MatchRecord = {
      ...match,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Get current stats
    const currentStats = await kv.get<Record<string, ModelStats>>(STATS_KEY) || {};

    // Initialize if needed
    if (!currentStats[match.winnerId]) {
      currentStats[match.winnerId] = {
        modelId: match.winnerId,
        wins: 0,
        losses: 0,
        headshots: 0,
        bodyshots: 0,
        totalShots: 0,
      };
    }
    if (!currentStats[match.loserId]) {
      currentStats[match.loserId] = {
        modelId: match.loserId,
        wins: 0,
        losses: 0,
        headshots: 0,
        bodyshots: 0,
        totalShots: 0,
      };
    }

    // Update winner stats
    currentStats[match.winnerId].wins += 1;
    currentStats[match.winnerId].totalShots += match.winnerShots;
    if (match.winReason === 'headshot') {
      currentStats[match.winnerId].headshots += 1;
    } else if (match.winReason === 'bodyshot') {
      currentStats[match.winnerId].bodyshots += 1;
    }

    // Update loser stats
    currentStats[match.loserId].losses += 1;
    currentStats[match.loserId].totalShots += match.loserShots;

    // Save everything
    await Promise.all([
      kv.set(STATS_KEY, currentStats),
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
