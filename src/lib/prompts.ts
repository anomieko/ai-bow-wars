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
 * Get detailed miss metrics for comparison
 */
interface MissMetrics {
  type: 'hit' | 'short' | 'height';
  value: number; // For short: reachedRatio (0-1), for height: distanceY (can be negative)
  absValue: number; // Absolute distance from perfect
}

function getMissMetrics(result: HitResult, path?: Vector2[], startX?: number, targetX?: number): MissMetrics {
  if (result.type === 'headshot') {
    return { type: 'hit', value: 1, absValue: 0 };
  }
  if (result.type === 'body') {
    return { type: 'hit', value: 0.9, absValue: 0.2 }; // Close but not perfect
  }

  // For misses that fell short
  if (result.fellShort && path && startX !== undefined && targetX !== undefined) {
    const trajectory = analyzeTrajectory(path, startX, targetX);
    return {
      type: 'short',
      value: trajectory.reachedRatio,
      absValue: 1 - trajectory.reachedRatio
    };
  }

  // Arrow reached target X - height miss
  return {
    type: 'height',
    value: result.distanceY,
    absValue: Math.abs(result.distanceY)
  };
}

/**
 * Describe reach ratio in qualitative terms
 */
function describeReach(ratio: number): string {
  if (ratio < 0.3) return 'barely left you';
  if (ratio < 0.5) return 'less than halfway';
  if (ratio < 0.65) return 'about halfway';
  if (ratio < 0.8) return 'past halfway';
  if (ratio < 0.9) return 'most of the way';
  if (ratio < 0.97) return 'almost there';
  return 'just barely short';
}

/**
 * Describe height miss in qualitative terms
 */
function describeHeight(distanceY: number): string {
  const abs = Math.abs(distanceY);
  const direction = distanceY > 0 ? 'high' : 'low';
  if (abs < 0.5) return `barely ${direction}`;
  if (abs < 1.0) return `slightly ${direction}`;
  if (abs < 2.0) return `${direction}`;
  if (abs < 3.5) return `quite ${direction}`;
  return `way ${direction}`;
}

/**
 * Generate qualitative comparison text between current and previous shot
 * Provides DATA about improvement/regression, not instructions on what to do
 */
function getDetailedComparison(
  current: MissMetrics,
  prev: MissMetrics | null,
  isFirstShot: boolean
): string {
  if (isFirstShot || !prev) return '';

  // Current shot was a hit
  if (current.type === 'hit') {
    return '';  // Hit result already says it all
  }

  // Previous was a hit, current isn't
  if (prev.type === 'hit') {
    return ' [vs prev: was a HIT, now missed]';
  }

  // Both are short misses - describe relative reach
  if (current.type === 'short' && prev.type === 'short') {
    const currDesc = describeReach(current.value);
    const prevDesc = describeReach(prev.value);

    if (current.value > prev.value + 0.1) {
      return ` [vs prev: reached further (was ${prevDesc}, now ${currDesc})]`;
    } else if (current.value < prev.value - 0.1) {
      return ` [vs prev: reached less far (was ${prevDesc}, now ${currDesc})]`;
    }
    return ` [vs prev: similar distance (${currDesc})]`;
  }

  // Both are height misses - describe relative height
  if (current.type === 'height' && prev.type === 'height') {
    const currH = current.value;
    const prevH = prev.value;
    const currDesc = describeHeight(currH);
    const prevDesc = describeHeight(prevH);

    // Check if direction changed (crossed over target)
    if ((currH > 0 && prevH < 0) || (currH < 0 && prevH > 0)) {
      return ` [vs prev: crossed over (was ${prevDesc}, now ${currDesc})]`;
    }

    // Same direction - compare closeness
    const currAbs = Math.abs(currH);
    const prevAbs = Math.abs(prevH);

    if (currAbs < prevAbs - 0.5) {
      return ` [vs prev: closer (was ${prevDesc}, now ${currDesc})]`;
    } else if (currAbs > prevAbs + 0.5) {
      return ` [vs prev: further off (was ${prevDesc}, now ${currDesc})]`;
    }
    return ` [vs prev: similar height (${currDesc})]`;
  }

  // Transitioned from short to height miss (now reaching target)
  if (current.type === 'height' && prev.type === 'short') {
    const currDesc = describeHeight(current.value);
    const prevDesc = describeReach(prev.value);
    return ` [vs prev: now reaching target (was ${prevDesc}, now ${currDesc})]`;
  }

  // Regressed from height to short (no longer reaching)
  if (current.type === 'short' && prev.type === 'height') {
    const currDesc = describeReach(current.value);
    const prevDesc = describeHeight(prev.value);
    return ` [vs prev: no longer reaching (was ${prevDesc}, now ${currDesc})]`;
  }

  return '';
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
    // Calculate miss metrics for comparison
    const startOffset = myTurns.length - recentTurns.length;

    shotHistory = recentTurns.map((t, idx) => {
      const shotNum = startOffset + idx + 1;
      const isLatest = idx === recentTurns.length - 1;
      const feedback = formatResultForPrompt(t.result, t.arrowPath, archer.position.x, opponent.position.x);

      // Get detailed comparison to previous shot
      const currentMetrics = getMissMetrics(t.result, t.arrowPath, archer.position.x, opponent.position.x);
      const prevTurn = idx > 0 ? recentTurns[idx - 1] : (startOffset > 0 ? myTurns[startOffset - 1] : null);
      const prevMetrics = prevTurn ? getMissMetrics(prevTurn.result, prevTurn.arrowPath, archer.position.x, opponent.position.x) : null;
      const comparison = getDetailedComparison(currentMetrics, prevMetrics, shotNum === 1);

      // Mark the latest shot clearly
      const prefix = isLatest ? `→ ${shotNum} (LATEST)` : `  ${shotNum}`;
      return `${prefix}: ${t.shot.angle.toFixed(0)}°/${t.shot.power.toFixed(0)}% → ${feedback}${comparison}`;
    }).join('\n');
  }

  const distanceDesc = getDistanceEstimate(distance);
  const windDesc = getWindEstimate(wind);

  return `Archer duel - hit before they hit you! Each miss = enemy gets a shot at you.

SITUATION:
- Target: ${distanceDesc}
- Wind: ${windDesc} blowing ${wind.direction.toUpperCase()} (constant - does not change between shots)
- HP: You ${archer.health}/2 | Enemy ${opponent.health}/2

AIMING: "power" controls distance, "angle" controls arc height. Learn from feedback below.

YOUR SHOTS (angle°/power%):
${shotHistory}

Shot ${nextShotNum}. Output ONLY JSON:
{"angle": 45, "power": 70, "reasoning": "brief"}
Angle: 0-90°. Power: 0-100% (100 is MAX, cannot exceed).`;
}

/**
 * Format hit result for AI feedback - purely descriptive, no instructions
 */
function formatResultForPrompt(
  result: HitResult,
  path?: Vector2[],
  startX?: number,
  targetX?: number
): string {
  switch (result.type) {
    case 'headshot':
      return 'HEADSHOT! Perfect hit!';
    case 'body':
      return 'BODY HIT! Struck their torso.';
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
          distanceDesc = 'way short, not even halfway there';
        } else if (reachedPct < 0.6) {
          distanceDesc = 'short, landed about halfway to target';
        } else if (reachedPct < 0.8) {
          distanceDesc = 'fell short, got most of the way there';
        } else if (reachedPct < 0.95) {
          distanceDesc = 'just short, almost reached them';
        } else {
          distanceDesc = 'barely short, so close';
        }

        // Describe trajectory shape
        let trajectoryDesc: string;
        if (trajectory.peakPosition === 'early') {
          trajectoryDesc = 'arrow peaked early and was falling when it landed';
        } else if (trajectory.peakPosition === 'late' && !trajectory.wasDescending) {
          trajectoryDesc = 'arrow was still climbing when it hit ground';
        } else {
          trajectoryDesc = 'arrow was descending at normal arc';
        }

        return `FELL SHORT: ${distanceDesc}. ${trajectoryDesc}.`;
      }

      // Arrow reached target X - report height at crossing
      const heightDiff = result.distanceY;

      // Describe trajectory at crossing point
      let crossingDesc: string;
      if (trajectory.wasDescending) {
        crossingDesc = 'arrow was descending';
      } else {
        crossingDesc = 'arrow was still rising';
      }

      if (Math.abs(heightDiff) < 0.5) {
        return `NEAR MISS: incredibly close, ${crossingDesc}.`;
      }

      if (heightDiff > 3) {
        return `SAILED OVER: passed way above them, ${crossingDesc}.`;
      } else if (heightDiff > 1.5) {
        return `TOO HIGH: passed above their head, ${crossingDesc}.`;
      } else if (heightDiff > 0) {
        return `SLIGHTLY HIGH: just over their head, ${crossingDesc}.`;
      } else if (heightDiff < -3) {
        return `WAY UNDER: passed well below them, ${crossingDesc}.`;
      } else if (heightDiff < -1.5) {
        return `TOO LOW: passed below their body, ${crossingDesc}.`;
      } else {
        return `SLIGHTLY LOW: just under them, ${crossingDesc}.`;
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

    // Remove markdown code blocks - both closed and unclosed (truncated)
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1');
    // Handle unclosed markdown blocks (when response is truncated)
    cleaned = cleaned.replace(/```(?:json)?\s*/gi, '');

    // Remove common prefixes AIs add (expanded list)
    cleaned = cleaned.replace(/^(?:sure!?|okay!?|here(?:'?s)?|my|the|i'?ll|let me)\s*(?:is\s+)?(?:my\s+)?(?:response|answer|shot|json|output)?\s*:?\s*/i, '');

    // Step 2: Try to extract JSON object (greedy to get full object)
    const jsonMatch = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (!jsonMatch) {
      // Try to extract values directly if no JSON found
      const angleMatch = cleaned.match(/angle["\s:]+(\d+(?:\.\d+)?)/i);
      const powerMatch = cleaned.match(/power["\s:]+(\d+(?:\.\d+)?)/i);
      if (angleMatch && powerMatch) {
        console.log('[NON-JSON EXTRACT]:', response.slice(0, 300));
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

    // Fix truncated JSON - if reasoning string is cut off, try to close it
    if (!jsonStr.endsWith('}')) {
      // Try to close truncated string and object
      jsonStr = jsonStr.replace(/,?\s*"reasoning"\s*:\s*"[^"]*$/, '') + '}';
    }

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
        console.log('[FALLBACK EXTRACT]:', response.slice(0, 300));
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
