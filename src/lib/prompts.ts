/**
 * AI prompt templates for the archery game
 */

import { Archer, Turn, Wind, HitResult } from '@/types/game';

/**
 * Estimate distance in vague terms
 */
function getDistanceEstimate(distance: number): string {
  if (distance < 85) return 'relatively close';
  if (distance < 95) return 'moderate distance';
  if (distance < 105) return 'a fair distance';
  if (distance < 115) return 'quite far';
  return 'very far';
}

/**
 * Estimate wind in vague terms
 */
function getWindEstimate(wind: Wind): string {
  if (wind.speed <= 3) return 'a light breeze';
  if (wind.speed <= 7) return 'moderate wind';
  if (wind.speed <= 11) return 'strong wind';
  return 'very strong wind';
}

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

  // Build shot history - only show YOUR shots and results (learning from feedback)
  let shotHistory = '';
  if (myTurns.length === 0) {
    shotHistory = 'This is your first shot. You have no feedback yet - make your best estimate!';
  } else {
    shotHistory = myTurns.map(t => {
      const resultStr = formatResultForPrompt(t.result);
      return `- Shot ${myTurns.indexOf(t) + 1}: ${t.shot.angle.toFixed(1)}° angle, ${t.shot.power.toFixed(0)}% power → ${resultStr}`;
    }).join('\n');
  }

  const distanceDesc = getDistanceEstimate(distance);
  const windDesc = getWindEstimate(wind);

  return `You are an archer in a turn-based duel. Hit your opponent to win!

WHAT YOU CAN SEE:
- Your enemy appears to be ${distanceDesc} away (you must estimate the exact distance)
- There is ${windDesc} blowing to the ${wind.direction.toUpperCase()}
- Both archers stand on flat ground

YOUR STATUS: ${archer.health}/2 HP remaining
ENEMY STATUS: ${opponent.health}/2 HP remaining

YOUR PREVIOUS SHOTS:
${shotHistory}

${myTurns.length > 0 ? `
LEARN FROM YOUR SHOTS:
- If shots went SHORT: increase power or lower angle
- If shots went LONG: decrease power or raise angle
- If shots went HIGH: lower your angle
- If shots went LOW: raise your angle
- Adjust for wind drift by aiming against it
` : ''}
Turn ${turnNumber}. Take your shot!

Respond with ONLY valid JSON:
{
  "reasoning": "Brief thought on your aim",
  "angle": <number 0-90>,
  "power": <number 0-100>
}`;
}

function formatResultForPrompt(result: HitResult): string {
  switch (result.type) {
    case 'headshot':
      return 'HEADSHOT! (instant kill)';
    case 'body':
      return 'HIT! (body shot, enemy took damage)';
    case 'miss':
      // Give vague feedback - no exact measurements
      const parts: string[] = [];

      // Horizontal feedback (short/long)
      if (Math.abs(result.distanceX) > 5) {
        parts.push(result.distanceX > 0 ? 'way too long' : 'way too short');
      } else if (Math.abs(result.distanceX) > 2) {
        parts.push(result.distanceX > 0 ? 'too long' : 'too short');
      } else if (Math.abs(result.distanceX) > 0.5) {
        parts.push(result.distanceX > 0 ? 'slightly long' : 'slightly short');
      }

      // Vertical feedback (high/low)
      if (Math.abs(result.distanceY) > 3) {
        parts.push(result.distanceY > 0 ? 'way too high' : 'way too low');
      } else if (Math.abs(result.distanceY) > 1) {
        parts.push(result.distanceY > 0 ? 'too high' : 'too low');
      } else if (Math.abs(result.distanceY) > 0.3) {
        parts.push(result.distanceY > 0 ? 'slightly high' : 'slightly low');
      }

      if (parts.length === 0) {
        return 'Miss - incredibly close! Just barely missed.';
      }
      return `Miss - arrow went ${parts.join(' and ')}`;
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
