'use client';

/**
 * Leaderboard screen showing AI rankings from Vercel KV
 */

import { useEffect, useState } from 'react';
import { MODELS, getModelConfig } from '@/config/models';

interface LeaderboardScreenProps {
  onBack: () => void;
}

interface ModelStats {
  modelId: string;
  wins: number;
  losses: number;
  headshots: number;
  bodyshots: number;
  totalShots: number;
}

interface LeaderboardData {
  stats: Record<string, ModelStats>;
  recentMatches: Array<{
    id: string;
    timestamp: string;
    winnerId: string;
    loserId: string;
    winReason: string;
  }>;
  totalMatches: number;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const json = await res.json();

        if (json.success && json.data) {
          setData(json.data);
          setIsMock(json.mock || false);
        } else if (json.mock) {
          // No KV configured, show empty state
          setIsMock(true);
          setData(null);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  // Sort models by win rate
  const sortedStats = data
    ? Object.values(data.stats)
        .map((stats) => ({
          ...stats,
          winRate: stats.wins + stats.losses > 0
            ? stats.wins / (stats.wins + stats.losses)
            : 0,
        }))
        .sort((a, b) => {
          // Sort by win rate, then by total wins
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.wins - a.wins;
        })
    : [];

  const totalMatches = data?.totalMatches || 0;
  const totalHeadshots = sortedStats.reduce((sum, s) => sum + s.headshots, 0);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"
        >
          <span>←</span> Back to Menu
        </button>

        <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400 mb-4">AI model rankings based on win rate</p>

        {/* Mock mode warning */}
        {isMock && (
          <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg">
            <p className="text-yellow-400 text-sm">
              {data === null
                ? 'Leaderboard database not configured. Results will not be saved.'
                : 'Running in test mode. Match results are not being recorded.'}
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-gray-400 animate-pulse">Loading leaderboard...</div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sortedStats.length > 0 && totalMatches === 0 && (
          <div className="text-center py-16 bg-gray-800 rounded-lg">
            <div className="text-6xl mb-4">🏹</div>
            <div className="text-xl text-white mb-2">No matches yet!</div>
            <div className="text-gray-400">
              Play some matches with real AI models to populate the leaderboard.
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        {!loading && !error && sortedStats.length > 0 && (
          <>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700 text-gray-300 text-sm font-semibold">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Model</div>
                <div className="col-span-2 text-center">Wins</div>
                <div className="col-span-2 text-center">Losses</div>
                <div className="col-span-2 text-center">Win Rate</div>
              </div>

              {/* Rows */}
              {sortedStats.map((stats, index) => {
                const config = getModelConfig(stats.modelId);
                const winRate = stats.wins + stats.losses > 0
                  ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
                  : '0.0';
                const isTop3 = index < 3;
                const hasMatches = stats.wins + stats.losses > 0;

                return (
                  <div
                    key={stats.modelId}
                    className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-700 items-center ${
                      isTop3 && hasMatches ? 'bg-gray-750' : ''
                    } ${!hasMatches ? 'opacity-50' : ''}`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center">
                      {hasMatches ? (
                        <>
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && <span className="text-gray-400">{index + 1}</span>}
                        </>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </div>

                    {/* Model */}
                    <div className="col-span-5 flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <div className="text-white font-semibold">{config.name}</div>
                        <div className="text-xs text-gray-500">{config.provider}</div>
                      </div>
                    </div>

                    {/* Wins */}
                    <div className="col-span-2 text-center text-green-400 font-semibold">
                      {stats.wins}
                    </div>

                    {/* Losses */}
                    <div className="col-span-2 text-center text-red-400">
                      {stats.losses}
                    </div>

                    {/* Win Rate */}
                    <div className="col-span-2 text-center">
                      <span
                        className={`font-bold ${
                          !hasMatches
                            ? 'text-gray-500'
                            : parseFloat(winRate) >= 60
                              ? 'text-green-400'
                              : parseFloat(winRate) >= 40
                                ? 'text-yellow-400'
                                : 'text-red-400'
                        }`}
                      >
                        {hasMatches ? `${winRate}%` : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats summary */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{totalMatches}</div>
                <div className="text-gray-400 text-sm">Total Matches</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{totalHeadshots}</div>
                <div className="text-gray-400 text-sm">Total Headshots</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-white">{MODELS.length}</div>
                <div className="text-gray-400 text-sm">AI Models</div>
              </div>
            </div>

            {/* Recent matches */}
            {data && data.recentMatches.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4">Recent Matches</h2>
                <div className="space-y-2">
                  {data.recentMatches.slice(0, 5).map((match) => {
                    const winner = getModelConfig(match.winnerId);
                    const loser = getModelConfig(match.loserId);
                    const timeAgo = getTimeAgo(match.timestamp);

                    return (
                      <div
                        key={match.id}
                        className="bg-gray-800 p-3 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span>{winner.icon}</span>
                          <span className="text-green-400 font-semibold">{winner.name}</span>
                          <span className="text-gray-500">defeated</span>
                          <span className="text-red-400">{loser.name}</span>
                          <span>{loser.icon}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${
                            match.winReason === 'headshot'
                              ? 'bg-red-900 text-red-300'
                              : match.winReason === 'bodyshot'
                                ? 'bg-orange-900 text-orange-300'
                                : 'bg-gray-700 text-gray-300'
                          }`}>
                            {match.winReason}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{timeAgo}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-gray-500 text-sm mt-8">
          {isMock
            ? 'Enable real AI models to start recording matches'
            : 'Leaderboard updates after each match'}
        </p>

        {/* Back button at bottom */}
        <button
          onClick={onBack}
          className="mt-8 w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

// Helper to format time ago
function getTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
