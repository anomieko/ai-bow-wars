/**
 * AI prompt templates for the archery game
 */

import { Archer, Turn, Wind, HitResult } from '@/types/game';

/**
 * Estimate distance in vague terms
 */
function getDistanceEstimate(distance: number): string {
  if (distance < 85) return 'relatively close (roughly 80m)';
  if (distance < 95) return 'moderate distance (roughly 90m)';
  if (distance < 105) return 'a fair distance (roughly 100m)';
  if (distance < 115) return 'quite far (roughly 110m)';
  return 'very far (roughly 120m)';
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

  // Build shot history with clear feedback
  let shotHistory = '';
  if (myTurns.length === 0) {
    shotHistory = 'This is your first shot. No feedback yet - estimate based on distance!';
  } else {
    shotHistory = myTurns.map(t => {
      const feedback = formatResultForPrompt(t.result);
      return `Shot ${myTurns.indexOf(t) + 1}: ${t.shot.angle.toFixed(0)}° @ ${t.shot.power.toFixed(0)}% → ${feedback}`;
    }).join('\n');
  }

  const distanceDesc = getDistanceEstimate(distance);
  const windDesc = getWindEstimate(wind);

  return `You are an archer in a duel. Hit your opponent to win!

SITUATION:
- Target is ${distanceDesc} away
- Wind: ${windDesc} blowing ${wind.direction.toUpperCase()}
- Your HP: ${archer.health}/2 | Enemy HP: ${opponent.health}/2

HOW AIMING WORKS:
- "power" controls distance (more power = arrow goes further)
- "angle" controls trajectory (higher angle = taller arc, but shorter distance)
- 45° gives maximum range for any power level
- Typical shots: 40-50° angle, 60-85% power

ADJUSTING YOUR AIM:
- Arrow FELL SHORT? → increase power OR decrease angle (flatter shot)
- Arrow went OVER target? → decrease angle (lower arc)
- Arrow went UNDER target? → increase angle (higher arc)

YOUR PREVIOUS SHOTS:
${shotHistory}

Respond with ONLY this JSON (no other text):
{"angle": 45, "power": 70, "reasoning": "your brief thought"}`;
}

/**
 * Format hit result for AI feedback - clear and actionable
 */
function formatResultForPrompt(result: HitResult): string {
  switch (result.type) {
    case 'headshot':
      return 'HEADSHOT! Perfect hit!';
    case 'body':
      return 'HIT! Body shot, enemy took damage.';
    case 'miss':
      // Check if arrow fell short
      if (result.fellShort) {
        const shortDist = Math.abs(result.distanceX);
        if (shortDist > 10) {
          return 'FELL WAY SHORT (need much more power or lower angle)';
        } else if (shortDist > 5) {
          return 'FELL SHORT (need more power or slightly lower angle)';
        } else {
          return 'JUST SHORT (need a bit more power)';
        }
      }

      // Arrow reached target X - report height at crossing
      const heightDiff = result.distanceY;
      if (Math.abs(heightDiff) < 0.5) {
        return 'NEAR MISS! Almost perfect - tiny adjustment needed.';
      }

      if (heightDiff > 3) {
        return 'SAILED OVER (much lower angle needed)';
      } else if (heightDiff > 1.5) {
        return 'TOO HIGH (lower angle needed)';
      } else if (heightDiff > 0) {
        return 'SLIGHTLY HIGH (slightly lower angle)';
      } else if (heightDiff < -3) {
        return 'WAY UNDER (much higher angle needed)';
      } else if (heightDiff < -1.5) {
        return 'TOO LOW (higher angle needed)';
      } else {
        return 'SLIGHTLY LOW (slightly higher angle)';
      }
  }
}

/**
 * Parse AI response to extract shot parameters
 * Handles common AI output quirks like markdown, extra text, malformed JSON
 */
export function parseAIResponse(response: string): { reasoning: string; angle: number; power: number } | null {
  try {
    // Step 1: Clean up the response
    let cleaned = response;

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/gi, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    // Remove common prefixes AIs add
    cleaned = cleaned.replace(/^(here'?s?|my|the)\s+(response|answer|shot|json)\s*:?\s*/i, '');

    // Step 2: Try to extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      // Try to extract values directly if no JSON found
      const angleMatch = cleaned.match(/angle["\s:]+(\d+)/i);
      const powerMatch = cleaned.match(/power["\s:]+(\d+)/i);
      if (angleMatch && powerMatch) {
        return {
          angle: Math.max(0, Math.min(90, parseInt(angleMatch[1]))),
          power: Math.max(0, Math.min(100, parseInt(powerMatch[1]))),
          reasoning: 'Extracted from non-JSON response',
        };
      }
      return null;
    }

    let jsonStr = jsonMatch[0];

    // Step 3: Fix common JSON issues
    // Replace single quotes with double quotes (but not in contractions)
    jsonStr = jsonStr.replace(/(\w)'(\w)/g, '$1APOSTROPHE$2'); // Protect contractions
    jsonStr = jsonStr.replace(/'/g, '"');
    jsonStr = jsonStr.replace(/APOSTROPHE/g, "'");

    // Remove trailing commas
    jsonStr = jsonStr.replace(/,\s*}/g, '}');
    jsonStr = jsonStr.replace(/,\s*]/g, ']');

    // Fix unquoted keys
    jsonStr = jsonStr.replace(/(\{|\,)\s*(\w+)\s*:/g, '$1"$2":');

    // Step 4: Parse and validate
    const parsed = JSON.parse(jsonStr);

    // Extract and validate values
    const angle = Math.max(0, Math.min(90, Number(parsed.angle) || 45));
    const power = Math.max(0, Math.min(100, Number(parsed.power) || 70));
    const reasoning = String(parsed.reasoning || parsed.thought || parsed.explanation || 'No reasoning provided');

    // Sanity check - if values are exactly defaults, parsing might have failed silently
    if (parsed.angle === undefined && parsed.power === undefined) {
      return null;
    }

    return { reasoning, angle, power };
  } catch {
    // Last resort: try regex extraction
    try {
      const angleMatch = response.match(/["']?angle["']?\s*:\s*(\d+(?:\.\d+)?)/i);
      const powerMatch = response.match(/["']?power["']?\s*:\s*(\d+(?:\.\d+)?)/i);

      if (angleMatch && powerMatch) {
        return {
          angle: Math.max(0, Math.min(90, parseFloat(angleMatch[1]))),
          power: Math.max(0, Math.min(100, parseFloat(powerMatch[1]))),
          reasoning: 'Extracted via fallback parsing',
        };
      }
    } catch {
      // Give up
    }
    return null;
  }
}
