/**
 * API route for AI to take a shot
 * POST /api/shoot
 */

import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { buildArcherPrompt, parseAIResponse } from '@/lib/prompts';
import { Archer, Turn, Wind } from '@/types/game';

// Mock mode for development (saves API credits)
const MOCK_MODE = process.env.MOCK_AI === 'true';

interface ShootRequest {
  modelId: string;
  archer: Archer;
  opponent: Archer;
  wind: Wind;
  distance: number;
  turns: Turn[];
  turnNumber: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShootRequest = await request.json();
    const { modelId, archer, opponent, wind, distance, turns, turnNumber } = body;

    // Build the prompt
    const prompt = buildArcherPrompt(archer, opponent, wind, distance, turns, turnNumber);

    let reasoning: string;
    let angle: number;
    let power: number;

    if (MOCK_MODE) {
      // Mock response for testing without using API credits
      const mockResponse = generateMockResponse(archer, opponent, wind, turns);
      reasoning = mockResponse.reasoning;
      angle = mockResponse.angle;
      power = mockResponse.power;
    } else {
      // Real AI Gateway call
      const result = await generateText({
        model: modelId,
        prompt,
        maxTokens: 200,
      });

      const parsed = parseAIResponse(result.text);

      if (!parsed) {
        // Fallback if parsing fails
        reasoning = 'Failed to parse response, using defaults';
        angle = 45;
        power = 70;
      } else {
        reasoning = parsed.reasoning;
        angle = parsed.angle;
        power = parsed.power;
      }
    }

    return NextResponse.json({
      success: true,
      shot: {
        reasoning,
        angle,
        power,
      },
    });
  } catch (error) {
    console.error('Error in /api/shoot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a mock response that simulates AI behavior
 * This helps test the game without using API credits
 */
function generateMockResponse(
  archer: Archer,
  opponent: Archer,
  wind: Wind,
  turns: Turn[]
): { reasoning: string; angle: number; power: number } {
  // Find previous shots by this archer
  const myTurns = turns.filter(t => t.modelId === archer.modelId);
  const lastTurn = myTurns[myTurns.length - 1];

  let baseAngle = 45;
  let basePower = 70;

  if (lastTurn) {
    // Adjust based on previous miss
    baseAngle = lastTurn.shot.angle;
    basePower = lastTurn.shot.power;

    if (lastTurn.result.type === 'miss') {
      const miss = lastTurn.result;

      // Adjust for horizontal miss
      if (miss.distanceX > 2) {
        basePower -= 5; // Too long, reduce power
      } else if (miss.distanceX < -2) {
        basePower += 5; // Too short, increase power
      }

      // Adjust for vertical miss
      if (miss.distanceY > 2) {
        baseAngle -= 3; // Too high, lower angle
      } else if (miss.distanceY < -2) {
        baseAngle += 3; // Too low, raise angle
      }
    }
  }

  // Add wind compensation
  const windCompensation = wind.direction === 'left' ? 2 : -2;
  baseAngle += windCompensation * (wind.speed / 15);

  // Add slight randomness
  const angle = Math.max(10, Math.min(80, baseAngle + (Math.random() - 0.5) * 4));
  const power = Math.max(40, Math.min(95, basePower + (Math.random() - 0.5) * 6));

  return {
    reasoning: `Adjusting aim based on ${lastTurn ? 'previous shot' : 'initial estimate'}. Wind is ${wind.speed}m/s ${wind.direction}.`,
    angle: Math.round(angle),
    power: Math.round(power),
  };
}
