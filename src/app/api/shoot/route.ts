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

/**
 * Generate a smart fallback shot based on game state
 * Much better than fixed 45/70 defaults
 */
function generateSmartFallback(
  archer: Archer,
  distance: number,
  turns: Turn[]
): { reasoning: string; angle: number; power: number } {
  // Find this archer's previous shots
  const myTurns = turns.filter(t => t.modelId === archer.modelId);
  const lastTurn = myTurns[myTurns.length - 1];

  if (lastTurn) {
    // Adjust from previous shot with small random variation
    let angle = lastTurn.shot.angle;
    let power = lastTurn.shot.power;

    // Apply small adjustments based on last result
    if (lastTurn.result.type === 'miss') {
      const miss = lastTurn.result;

      // If fell short, increase power
      if (miss.fellShort || miss.distanceX < -1) {
        power = Math.min(95, power + 5 + Math.random() * 5);
      }
      // If too high, lower angle
      if (miss.distanceY > 1) {
        angle = Math.max(15, angle - 3 - Math.random() * 3);
      }
      // If too low, raise angle
      if (miss.distanceY < -1) {
        angle = Math.min(75, angle + 3 + Math.random() * 3);
      }
    }

    // Add small random variation to avoid getting stuck
    angle += (Math.random() - 0.5) * 4;
    power += (Math.random() - 0.5) * 6;

    return {
      reasoning: 'AI response parsing failed - adjusting from previous shot',
      angle: Math.round(Math.max(10, Math.min(80, angle))),
      power: Math.round(Math.max(40, Math.min(95, power))),
    };
  }

  // No previous shots - estimate based on distance
  // Rough heuristic: further distance needs more power
  const estimatedPower = Math.min(90, 55 + distance * 0.25);
  const estimatedAngle = 42 + (Math.random() - 0.5) * 6;

  return {
    reasoning: 'AI response parsing failed - using distance-based estimate',
    angle: Math.round(estimatedAngle),
    power: Math.round(estimatedPower),
  };
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
        maxOutputTokens: 200,
      });

      const parsed = parseAIResponse(result.text);

      if (!parsed) {
        // Smart fallback if parsing fails
        console.warn(`Failed to parse AI response for ${modelId}:`, result.text.slice(0, 200));
        const fallback = generateSmartFallback(archer, distance, turns);
        reasoning = fallback.reasoning;
        angle = fallback.angle;
        power = fallback.power;
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
  let reasoningParts: string[] = [];

  if (lastTurn) {
    // Adjust based on previous miss
    baseAngle = lastTurn.shot.angle;
    basePower = lastTurn.shot.power;

    if (lastTurn.result.type === 'miss') {
      const miss = lastTurn.result;

      // Check if arrow fell short
      if (miss.fellShort) {
        basePower += 8; // Need more power to reach target
        baseAngle -= 2; // Slightly flatter trajectory
        reasoningParts.push('increasing power (fell short)');
      } else {
        // Arrow reached target X - adjust based on height
        if (miss.distanceY > 2) {
          baseAngle -= 4; // Way too high, lower angle more
          reasoningParts.push('lowering angle (too high)');
        } else if (miss.distanceY > 0.5) {
          baseAngle -= 2; // Too high, lower angle
          reasoningParts.push('slightly lowering angle');
        } else if (miss.distanceY < -2) {
          baseAngle += 4; // Way too low, raise angle
          reasoningParts.push('raising angle (too low)');
        } else if (miss.distanceY < -0.5) {
          baseAngle += 2; // Too low, raise angle
          reasoningParts.push('slightly raising angle');
        }
      }
    } else if (lastTurn.result.type === 'body') {
      // Got a body shot, try for headshot - aim slightly higher
      baseAngle += 1;
      reasoningParts.push('aiming for headshot');
    }
  } else {
    reasoningParts.push('initial estimate');
  }

  // Add wind compensation
  const windCompensation = wind.direction === 'left' ? 2 : -2;
  baseAngle += windCompensation * (wind.speed / 15);
  if (wind.speed > 5) {
    reasoningParts.push(`compensating for ${wind.direction} wind`);
  }

  // Add slight randomness
  const angle = Math.max(10, Math.min(80, baseAngle + (Math.random() - 0.5) * 3));
  const power = Math.max(40, Math.min(95, basePower + (Math.random() - 0.5) * 4));

  return {
    reasoning: reasoningParts.length > 0 ? reasoningParts.join(', ') : 'Taking the shot',
    angle: Math.round(angle),
    power: Math.round(power),
  };
}
