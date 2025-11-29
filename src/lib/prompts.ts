/**
 * AI prompt templates for the archery game
 */

import { Archer, Turn, Wind, HitResult } from '@/types/game';

/**
 * Build the prompt for an AI archer to take their shot
 */
export function buildArcherPrompt(
  archer: Archer,
  opponent: Archer,
  wind: Wind,
  distance: number,
  turns: Turn[],
  turnNumber: number
): string {
  // Filter turns for this archer only
  const myTurns = turns.filter(t => t.modelId === archer.modelId);

  // Build shot history
  let shotHistory = '';
  if (turns.length === 0) {
    shotHistory = 'This is the first turn. No shots have been fired yet.';
  } else {
    shotHistory = turns.map(t => {
      const isMe = t.modelId === archer.modelId;
      const prefix = isMe ? 'You' : 'Enemy';
      const resultStr = formatResultForPrompt(t.result);
      return `- Turn ${t.turnNumber} (${prefix}): ${t.shot.angle}°, ${t.shot.power}% power → ${resultStr}`;
    }).join('\n');
  }

  // Calculate height difference
  const heightDiff = archer.position.y - opponent.position.y;
  const heightStr = heightDiff > 0
    ? `You are ${Math.abs(heightDiff).toFixed(1)}m higher than your enemy`
    : heightDiff < 0
      ? `You are ${Math.abs(heightDiff).toFixed(1)}m lower than your enemy`
      : 'You and your enemy are at the same height';

  return `You are an archer in a turn-based duel. Your goal is to hit your opponent with an arrow.

MATCH CONDITIONS:
- Distance to enemy: ~${distance} meters
- Wind: ${wind.speed} m/s blowing ${wind.direction.toUpperCase()}
- ${heightStr}

YOUR STATUS:
- Health: ${archer.health}/2
- Position: ${archer.side} side

ENEMY STATUS:
- Health: ${opponent.health}/2
- Position: ${opponent.side} side

SHOT HISTORY:
${shotHistory}

It's Turn ${turnNumber}. ${myTurns.length > 0 ? 'Use your previous shots to adjust your aim.' : 'Take your first shot!'}

PHYSICS TIPS:
- Higher angle = more arc, good for long distances
- Higher power = faster arrow, travels further
- Wind blowing ${wind.direction} will push arrows to the ${wind.direction}
- Compensate by aiming ${wind.direction === 'left' ? 'right' : 'left'} of target

Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "reasoning": "Brief explanation of your aim adjustment",
  "angle": <number 0-90>,
  "power": <number 0-100>
}`;
}

function formatResultForPrompt(result: HitResult): string {
  switch (result.type) {
    case 'headshot':
      return 'HEADSHOT! (instant kill)';
    case 'body':
      return 'HIT (body shot)';
    case 'miss':
      const parts: string[] = [];
      if (Math.abs(result.distanceX) > 0.5) {
        parts.push(`${Math.abs(result.distanceX).toFixed(1)}m ${result.distanceX > 0 ? 'long' : 'short'}`);
      }
      if (Math.abs(result.distanceY) > 0.5) {
        parts.push(`${Math.abs(result.distanceY).toFixed(1)}m ${result.distanceY > 0 ? 'high' : 'low'}`);
      }
      return parts.length > 0 ? `Miss (${parts.join(', ')})` : 'Miss (very close!)';
  }
}

/**
 * Parse AI response to extract shot parameters
 */
export function parseAIResponse(response: string): { reasoning: string; angle: number; power: number } | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and clamp values
    const angle = Math.max(0, Math.min(90, Number(parsed.angle) || 45));
    const power = Math.max(0, Math.min(100, Number(parsed.power) || 70));
    const reasoning = String(parsed.reasoning || 'No reasoning provided');

    return { reasoning, angle, power };
  } catch {
    return null;
  }
}
