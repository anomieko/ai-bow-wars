'use client';

/**
 * Leaderboard screen - Modern clean design
 */

import { useEffect, useState } from 'react';
import { MODELS, getModelConfig } from '@/config/models';

interface LeaderboardScreenProps {
  onBack: () => void;
}

interface ModelStats {
  modelId: string;
  elo: number;
  wins: number;
  losses: number;
  ties: number;
  headshots: number;
  bodyshots: number;
  totalShots: number;
  rankedGames: number;
}

// Minimum games required for ranking
const MIN_GAMES_FOR_RANKING = 3;

interface RecentMatch {
  id: string;
  timestamp: string;
  winnerId: string | null;
  loserId: string | null;
  leftModelId?: string;
  rightModelId?: string;
  winReason: 'headshot' | 'bodyshot' | 'timeout' | 'tie';
  winnerShots?: number;
  loserShots?: number;
  distance?: number;
  windSpeed?: number;
  windDirection?: 'left' | 'right';
  matchType?: 'random' | 'custom';
}

interface LeaderboardData {
  stats: Record<string, ModelStats>;
  recentMatches: RecentMatch[];
  totalMatches: number;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard', { signal: controller.signal });
        const json = await res.json();

        if (!isMounted) return; // Don't setState if unmounted

        if (json.success && json.data) {
          setData(json.data);
          setIsMock(json.mock || false);
        } else if (json.mock) {
          setIsMock(true);
          setData(null);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Request timed out');
        } else {
          console.error('Failed to fetch leaderboard:', err);
          setError('Failed to load leaderboard');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  // Sort models by ELO (ranked models first, then unranked by games played)
  const sortedStats = data
    ? Object.values(data.stats)
        .map((stats) => {
          const isRanked = stats.rankedGames >= MIN_GAMES_FOR_RANKING;
          return {
            ...stats,
            isRanked,
          };
        })
        .sort((a, b) => {
          // Ranked models come first
          if (a.isRanked && !b.isRanked) return -1;
          if (!a.isRanked && b.isRanked) return 1;
          // Within same category, sort by ELO
          if (b.elo !== a.elo) return b.elo - a.elo;
          // Tiebreaker: more games played
          return b.rankedGames - a.rankedGames;
        })
    : [];

  const totalMatches = data?.totalMatches || 0;
  const totalRankedGames = sortedStats.reduce((sum, s) => sum + s.rankedGames, 0) / 2; // Divide by 2 since each match has 2 participants
  const totalHeadshots = sortedStats.reduce((sum, s) => sum + s.headshots, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold text-white">Rankings</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Mock mode warning */}
          {isMock && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-yellow-200 text-sm font-medium">
                {data === null ? 'Database not configured' : 'Test mode'}
              </span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 text-white/50">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                Loading...
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20">
              <div className="text-red-400">{error}</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sortedStats.length > 0 && totalMatches === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏹</div>
              <div className="text-xl text-white font-semibold mb-2">No matches yet</div>
              <div className="text-white/50">Start a battle to see rankings</div>
            </div>
          )}

          {/* Stats row */}
          {!loading && !error && (
            <div className="flex items-center justify-center gap-8 mb-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white">{Math.floor(totalRankedGames)}</div>
                <div className="text-white/40 text-sm">Ranked</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-3xl font-bold text-red-400">{totalHeadshots}</div>
                <div className="text-white/40 text-sm">Headshots</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-3xl font-bold text-white">{MODELS.length}</div>
                <div className="text-white/40 text-sm">Models</div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {!loading && !error && sortedStats.length > 0 && (
            <div className="space-y-2">
              {sortedStats.map((stats, index) => {
                const config = getModelConfig(stats.modelId);
                const hasMatches = stats.rankedGames > 0;
                const isRanked = stats.isRanked;

                // Only count ranked positions for medals
                const rankedIndex = sortedStats.filter(s => s.isRanked).findIndex(s => s.modelId === stats.modelId);

                return (
                  <div
                    key={stats.modelId}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      !hasMatches ? 'opacity-40' : !isRanked ? 'opacity-60' : 'hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isRanked && rankedIndex < 3 ? `${config.color}10` : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {isRanked ? (
                        <>
                          {rankedIndex === 0 && <span className="text-2xl">🥇</span>}
                          {rankedIndex === 1 && <span className="text-2xl">🥈</span>}
                          {rankedIndex === 2 && <span className="text-2xl">🥉</span>}
                          {rankedIndex > 2 && <span className="text-white/30 font-medium">{rankedIndex + 1}</span>}
                        </>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </div>

                    {/* Model */}
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{config.icon}</span>
                      <div>
                        <div className="text-white font-semibold">{config.name}</div>
                        <div className="text-sm text-white/40">
                          {config.provider}
                          {!isRanked && hasMatches && (
                            <span className="ml-2 text-yellow-400/60">
                              ({MIN_GAMES_FOR_RANKING - stats.rankedGames} more to rank)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Record */}
                    <div className="text-center px-4">
                      <div className="text-sm">
                        <span className="text-emerald-400 font-semibold">{stats.wins}</span>
                        <span className="text-white/20 mx-1">-</span>
                        <span className="text-red-400">{stats.losses}</span>
                        {stats.ties > 0 && (
                          <>
                            <span className="text-white/20 mx-1">-</span>
                            <span className="text-white/40">{stats.ties}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-white/30">W-L-T</div>
                    </div>

                    {/* ELO Score */}
                    <div className="w-20 text-right">
                      {hasMatches ? (
                        <div>
                          <span
                            className="text-lg font-bold"
                            style={{
                              color: isRanked
                                ? stats.elo >= 1100 ? '#4ade80'
                                : stats.elo >= 900 ? '#facc15'
                                : '#f87171'
                                : '#6b7280',
                            }}
                          >
                            {stats.elo}
                          </span>
                          <div className="text-xs text-white/30">ELO</div>
                        </div>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent matches */}
          {data && data.recentMatches.length > 0 && (
            <div className="mt-10">
              <h2 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-4">Recent Matches</h2>
              <div className="space-y-2">
                {data.recentMatches.slice(0, 5).map((match) => {
                  const isTie = match.winReason === 'tie';
                  const timeAgo = getTimeAgo(match.timestamp);
                  const isRanked = match.matchType !== 'custom';

                  if (isTie) {
                    const left = getModelConfig(match.leftModelId || 'unknown');
                    const right = getModelConfig(match.rightModelId || 'unknown');
                    return (
                      <div
                        key={match.id}
                        className={`flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ${!isRanked ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-xl">{left.icon}</span>
                          <span className="text-white/80">{left.name}</span>
                          <span className="text-white/30 px-2">draw</span>
                          <span className="text-white/80">{right.name}</span>
                          <span className="text-xl">{right.icon}</span>
                          {!isRanked && <span className="ml-1 text-xs text-white/30">(custom)</span>}
                        </div>
                        <div className="text-xs text-white/30">{timeAgo}</div>
                      </div>
                    );
                  }

                  const winner = getModelConfig(match.winnerId || 'unknown');
                  const loser = getModelConfig(match.loserId || 'unknown');

                  return (
                    <div
                      key={match.id}
                      className={`flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ${!isRanked ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xl">{winner.icon}</span>
                        <span className="text-emerald-400 font-medium">{winner.name}</span>
                        <span className="text-white/30">beat</span>
                        <span className="text-white/50">{loser.name}</span>
                        <span className="text-xl">{loser.icon}</span>
                        {match.winReason === 'headshot' && (
                          <span className="ml-1 text-xs text-red-400">headshot</span>
                        )}
                        {!isRanked && <span className="ml-1 text-xs text-white/30">(custom)</span>}
                      </div>
                      <div className="text-xs text-white/30">{timeAgo}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back button */}
          <button
            onClick={onBack}
            className="mt-10 w-full text-white/50 hover:text-white/80 text-sm py-3 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
