/**
 * AI prompt templates for the archery game
 */

import { Archer, Turn, Wind, HitResult, Vector2 } from '@/types/game';

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
 * Estimate wind in vague terms with effect description
 */
function getWindEstimate(wind: Wind): string {
  if (wind.speed <= 3) return 'a light breeze (minimal effect)';
  if (wind.speed <= 7) return 'moderate wind (will nudge your arrow)';
  if (wind.speed <= 11) return 'strong wind (significant drift expected)';
  return 'very strong wind (major compensation needed)';
}

/**
 * Analyze arrow trajectory to get qualitative description
 */
function analyzeTrajectory(path: Vector2[], startX: number, targetX: number): {
  peakPosition: 'early' | 'middle' | 'late';
  wasDescending: boolean;
  reachedRatio: number; // 0-1, how far toward target
} {
  if (path.length < 2) {
    return { peakPosition: 'middle', wasDescending: true, reachedRatio: 0 };
  }

  // Find peak (highest point)
  let peakIndex = 0;
  let peakY = path[0].y;
  for (let i = 1; i < path.length; i++) {
    if (path[i].y > peakY) {
      peakY = path[i].y;
      peakIndex = i;
    }
  }

  // Calculate where peak occurred relative to journey
  const peakRatio = peakIndex / (path.length - 1);
  const peakPosition: 'early' | 'middle' | 'late' =
    peakRatio < 0.35 ? 'early' : peakRatio > 0.65 ? 'late' : 'middle';

  // Was arrow descending at end?
  const lastPoints = path.slice(-3);
  const wasDescending = lastPoints.length >= 2 &&
    lastPoints[lastPoints.length - 1].y < lastPoints[0].y;

  // How far did arrow get toward target?
  const totalDistance = Math.abs(targetX - startX);
  const arrowDistance = Math.abs(path[path.length - 1].x - startX);
  const reachedRatio = Math.min(1, arrowDistance / totalDistance);

  return { peakPosition, wasDescending, reachedRatio };
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
  const nextShotNum = myTurns.length + 1;

  // Build shot history with detailed feedback (limit to last 4 shots to save tokens)
  const recentTurns = myTurns.slice(-4);
  let shotHistory = '';
  if (recentTurns.length === 0) {
    shotHistory = 'No shots yet - estimate based on distance and wind!';
  } else {
    shotHistory = recentTurns.map((t, idx) => {
      const shotNum = myTurns.length - recentTurns.length + idx + 1;
      const feedback = formatResultForPrompt(t.result, t.arrowPath, archer.position.x, opponent.position.x);
      return `${shotNum}: ${t.shot.angle.toFixed(0)}°/${t.shot.power.toFixed(0)}% → ${feedback}`;
    }).join('\n');
  }

  const distanceDesc = getDistanceEstimate(distance);
  const windDesc = getWindEstimate(wind);

  return `Archer duel - hit your opponent to win!

SITUATION:
- Target: ${distanceDesc}
- Wind: ${windDesc} blowing ${wind.direction.toUpperCase()}
- HP: You ${archer.health}/2 | Enemy ${opponent.health}/2

AIMING: "power" controls distance, "angle" controls arc height. Learn from feedback below.

YOUR SHOTS (angle°/power%):
${shotHistory}

Shot ${nextShotNum}. Output ONLY this JSON format, nothing else:
{"angle": 45, "power": 70, "reasoning": "adjusting for wind"}
Replace values with your chosen angle (0-90), power (0-100), and reasoning.`;
}

/**
 * Format hit result for AI feedback - rich qualitative descriptions
 */
function formatResultForPrompt(
  result: HitResult,
  path?: Vector2[],
  startX?: number,
  targetX?: number
): string {
  switch (result.type) {
    case 'headshot':
      return 'HEADSHOT! Perfect hit! Remember this angle and power!';
    case 'body':
      return 'HIT! Body shot - good aim! Fine-tune for headshot.';
    case 'miss':
      // Get trajectory analysis if we have path data
      let trajectory: { peakPosition: 'early' | 'middle' | 'late'; wasDescending: boolean; reachedRatio: number } =
        { peakPosition: 'middle', wasDescending: true, reachedRatio: 0.5 };
      if (path && startX !== undefined && targetX !== undefined) {
        trajectory = analyzeTrajectory(path, startX, targetX);
      }

      // Check if arrow fell short
      if (result.fellShort) {
        const reachedPct = trajectory.reachedRatio;

        // Describe how far it got
        let distanceDesc: string;
        if (reachedPct < 0.4) {
          distanceDesc = 'way short (not even halfway there)';
        } else if (reachedPct < 0.6) {
          distanceDesc = 'short (landed about halfway to target)';
        } else if (reachedPct < 0.8) {
          distanceDesc = 'fell short (got most of the way there)';
        } else if (reachedPct < 0.95) {
          distanceDesc = 'just short (almost reached them!)';
        } else {
          distanceDesc = 'barely short (so close!)';
        }

        // Describe trajectory shape
        let trajectoryDesc: string;
        if (trajectory.peakPosition === 'early') {
          trajectoryDesc = 'Arrow peaked early and was falling when it landed - try more power or lower angle';
        } else if (trajectory.peakPosition === 'late' && !trajectory.wasDescending) {
          trajectoryDesc = 'Arrow was still climbing - too much angle, try flatter';
        } else {
          trajectoryDesc = 'Need more power to reach target';
        }

        return `FELL SHORT: ${distanceDesc}. ${trajectoryDesc}`;
      }

      // Arrow reached target X - report height at crossing
      const heightDiff = result.distanceY;

      // Describe trajectory at crossing point
      let crossingDesc: string;
      if (trajectory.wasDescending) {
        crossingDesc = 'arrow was descending';
      } else {
        crossingDesc = 'arrow was still rising (too much angle)';
      }

      if (Math.abs(heightDiff) < 0.5) {
        return `NEAR MISS! Incredibly close - ${crossingDesc}. Tiny adjustment needed!`;
      }

      if (heightDiff > 3) {
        return `SAILED OVER: Arrow passed way above them (${crossingDesc}). Need much lower angle.`;
      } else if (heightDiff > 1.5) {
        return `TOO HIGH: Arrow passed above their head (${crossingDesc}). Lower your angle.`;
      } else if (heightDiff > 0) {
        return `SLIGHTLY HIGH: Just over their head (${crossingDesc}). Tiny bit lower angle.`;
      } else if (heightDiff < -3) {
        return `WAY UNDER: Arrow passed well below them (${crossingDesc}). Need higher angle.`;
      } else if (heightDiff < -1.5) {
        return `TOO LOW: Arrow passed below their body (${crossingDesc}). Raise your angle.`;
      } else {
        return `SLIGHTLY LOW: Just under them (${crossingDesc}). Tiny bit higher angle.`;
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
    let cleaned = response.trim();

    // Remove markdown code blocks (greedy)
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1');

    // Remove common prefixes AIs add (expanded list)
    cleaned = cleaned.replace(/^(?:sure!?|okay!?|here(?:'?s)?|my|the|i'?ll|let me)\s*(?:is\s+)?(?:my\s+)?(?:response|answer|shot|json|output)?\s*:?\s*/i, '');

    // Step 2: Try to extract JSON object (greedy to get full object)
    const jsonMatch = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (!jsonMatch) {
      // Try to extract values directly if no JSON found
      const angleMatch = cleaned.match(/angle["\s:]+(\d+(?:\.\d+)?)/i);
      const powerMatch = cleaned.match(/power["\s:]+(\d+(?:\.\d+)?)/i);
      if (angleMatch && powerMatch) {
        return {
          angle: Math.max(0, Math.min(90, parseFloat(angleMatch[1]))),
          power: Math.max(0, Math.min(100, parseFloat(powerMatch[1]))),
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
    jsonStr = jsonStr.replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":');

    // Step 4: Parse and validate
    const parsed = JSON.parse(jsonStr);

    // Handle string-wrapped numbers (some models return "45" instead of 45)
    const rawAngle = parsed.angle;
    const rawPower = parsed.power;

    const angle = Math.max(0, Math.min(90, Number(rawAngle) || 0));
    const power = Math.max(0, Math.min(100, Number(rawPower) || 0));
    const reasoning = String(parsed.reasoning || parsed.thought || parsed.explanation || 'No reasoning provided');

    // Sanity check - must have both angle and power as valid numbers
    if ((rawAngle === undefined && rawPower === undefined) || (isNaN(angle) && isNaN(power))) {
      return null;
    }

    // If one value is missing/invalid, return null (don't use partial data)
    if (angle === 0 && rawAngle === undefined) return null;
    if (power === 0 && rawPower === undefined) return null;

    return { reasoning, angle, power };
  } catch {
    // Last resort: try regex extraction from original response
    try {
      const angleMatch = response.match(/["']?angle["']?\s*:\s*["']?(\d+(?:\.\d+)?)["']?/i);
      const powerMatch = response.match(/["']?power["']?\s*:\s*["']?(\d+(?:\.\d+)?)["']?/i);

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
