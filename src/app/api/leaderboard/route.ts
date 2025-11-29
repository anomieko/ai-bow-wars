/**
 * Leaderboard API endpoints
 */

import { NextResponse } from 'next/server';
import { getLeaderboard, recordMatch, shouldRecordMatches } from '@/lib/leaderboard';

/**
 * GET /api/leaderboard - Get current leaderboard data
 */
export async function GET() {
  try {
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json({
        success: true,
        data: null,
        mock: true,
        message: 'Leaderboard not configured (no KV database)',
      });
    }

    const data = await getLeaderboard();

    return NextResponse.json({
      success: true,
      data,
      mock: process.env.MOCK_AI === 'true',
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leaderboard - Record a match result
 */
export async function POST(request: Request) {
  try {
    // Don't record if using mock AI or KV not configured
    if (!shouldRecordMatches()) {
      return NextResponse.json({
        success: true,
        recorded: false,
        reason: process.env.MOCK_AI === 'true'
          ? 'Mock mode - results not recorded'
          : 'KV database not configured',
      });
    }

    const body = await request.json();

    // Validate required fields
    const { winnerId, loserId, leftModelId, rightModelId, winReason, winnerShots, loserShots, distance, windSpeed, windDirection } = body;

    // For ties, we need leftModelId and rightModelId. For wins, we need winnerId and loserId.
    if (winReason === 'tie') {
      if (!leftModelId || !rightModelId) {
        return NextResponse.json(
          { success: false, error: 'Missing model IDs for tie' },
          { status: 400 }
        );
      }
    } else {
      if (!winnerId || !loserId || !winReason) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }
    }

    await recordMatch({
      winnerId: winnerId || null,
      loserId: loserId || null,
      leftModelId,
      rightModelId,
      winReason,
      winnerShots: winnerShots || 0,
      loserShots: loserShots || 0,
      distance: distance || 100,
      windSpeed: windSpeed || 0,
      windDirection: windDirection || 'left',
    });

    return NextResponse.json({
      success: true,
      recorded: true,
    });
  } catch (error) {
    console.error('Leaderboard POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record match' },
      { status: 500 }
    );
  }
}
