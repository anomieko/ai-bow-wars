/**
 * Physics engine for arrow trajectory and hit detection
 */

import { Vector2, Wind, HitResult, GAME_CONSTANTS, Archer } from '@/types/game';

const { GRAVITY, MAX_VELOCITY, HEAD_HITBOX_RADIUS, BODY_HITBOX_WIDTH, BODY_HITBOX_HEIGHT } = GAME_CONSTANTS;

export interface ArrowSimulation {
  path: Vector2[];
  finalPosition: Vector2;
  flightTime: number;
  hitResult: HitResult;
}

/**
 * Simulate arrow trajectory with wind effects
 */
export function simulateArrow(
  startPos: Vector2,
  angle: number,
  power: number,
  wind: Wind,
  targetArcher: Archer
): ArrowSimulation {
  const angleRad = (angle * Math.PI) / 180;
  const velocity = (power / 100) * MAX_VELOCITY;

  let vx = velocity * Math.cos(angleRad);
  let vy = velocity * Math.sin(angleRad);

  // Wind effect multiplier (scaled for game balance)
  // 0.25 makes wind a significant factor: wind 7 = ~9m drift, wind 15 = ~18m drift
  const windEffect = wind.direction === 'left' ? -wind.speed * 0.25 : wind.speed * 0.25;

  const path: Vector2[] = [];
  let x = startPos.x;
  let y = startPos.y;
  let t = 0;
  const dt = 0.016; // ~60fps timestep

  // Determine direction (shooting left or right)
  const shootingRight = targetArcher.position.x > startPos.x;
  if (!shootingRight) {
    vx = -vx; // Flip velocity if shooting left
  }

  let hitResult: HitResult = { type: 'miss', distanceX: 0, distanceY: 0 };
  let hasHit = false;

  // Simulate until arrow hits ground or goes too far
  while (y >= 0 && Math.abs(x - startPos.x) < 200 && !hasHit) {
    path.push({ x, y });

    // Check for hit on target
    const hitCheck = checkHit({ x, y }, targetArcher);
    if (hitCheck) {
      hitResult = hitCheck;
      hasHit = true;
      break;
    }

    // Apply wind to horizontal velocity each frame
    vx += windEffect * dt;

    // Update position
    x += vx * dt;
    y += vy * dt;

    // Apply gravity
    vy -= GRAVITY * dt;

    t += dt;
  }

  // If no hit, calculate miss distance based on where arrow crossed target's X
  if (!hasHit) {
    const targetX = targetArcher.position.x;
    const targetY = targetArcher.position.y + BODY_HITBOX_HEIGHT / 2; // Center of body

    // Find where arrow crossed the target's X position
    let crossingPoint: Vector2 | null = null;
    let fellShort = true;
    let maxX = startPos.x; // Track how far the arrow got

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];

      // Track max distance reached
      if (shootingRight) {
        maxX = Math.max(maxX, curr.x);
      } else {
        maxX = Math.min(maxX, curr.x);
      }

      // Check if we crossed target X (works for both directions)
      const crossedRight = shootingRight && prev.x <= targetX && curr.x >= targetX;
      const crossedLeft = !shootingRight && prev.x >= targetX && curr.x <= targetX;

      if (crossedRight || crossedLeft) {
        // Interpolate Y at target X
        const t = (targetX - prev.x) / (curr.x - prev.x);
        crossingPoint = { x: targetX, y: prev.y + t * (curr.y - prev.y) };
        fellShort = false;
        break;
      }
    }

    if (fellShort) {
      // Arrow never reached target X - report how short it fell
      const shortDistance = shootingRight
        ? targetX - maxX
        : maxX - targetX;

      // Find the highest point to indicate trajectory type
      const peakY = Math.max(...path.map(p => p.y));
      const peakRelativeToTarget = peakY - targetY;

      hitResult = {
        type: 'miss',
        distanceX: -Math.round(shortDistance * 10) / 10, // Negative = short
        distanceY: Math.round(peakRelativeToTarget * 10) / 10, // How high the arc was
        fellShort: true,
      };
    } else if (crossingPoint) {
      // Arrow crossed target X - report height difference at that point
      hitResult = {
        type: 'miss',
        distanceX: 0, // At target X, so no horizontal error
        distanceY: Math.round((crossingPoint.y - targetY) * 10) / 10,
        fellShort: false,
      };
    } else {
      // Fallback (shouldn't happen)
      hitResult = {
        type: 'miss',
        distanceX: 0,
        distanceY: 0,
      };
    }
  }

  return {
    path,
    finalPosition: path[path.length - 1] || { x, y },
    flightTime: t,
    hitResult,
  };
}

/**
 * Check if arrow position hits the target archer
 */
function checkHit(arrowPos: Vector2, target: Archer): HitResult | null {
  const targetX = target.position.x;
  const targetY = target.position.y;

  // Head hitbox (circle at top of body)
  const headCenterY = targetY + BODY_HITBOX_HEIGHT + HEAD_HITBOX_RADIUS;
  const headDist = Math.sqrt(
    Math.pow(arrowPos.x - targetX, 2) + Math.pow(arrowPos.y - headCenterY, 2)
  );

  if (headDist <= HEAD_HITBOX_RADIUS) {
    return { type: 'headshot' };
  }

  // Body hitbox (rectangle)
  const bodyLeft = targetX - BODY_HITBOX_WIDTH / 2;
  const bodyRight = targetX + BODY_HITBOX_WIDTH / 2;
  const bodyBottom = targetY;
  const bodyTop = targetY + BODY_HITBOX_HEIGHT;

  if (
    arrowPos.x >= bodyLeft &&
    arrowPos.x <= bodyRight &&
    arrowPos.y >= bodyBottom &&
    arrowPos.y <= bodyTop
  ) {
    return { type: 'body' };
  }

  return null;
}

/**
 * Generate random match setup
 */
export function generateMatchSetup(): {
  distance: number;
  leftArcherY: number;
  rightArcherY: number;
  wind: Wind;
} {
  const { MIN_DISTANCE, MAX_DISTANCE, MIN_HEIGHT_OFFSET, MAX_HEIGHT_OFFSET, MIN_WIND, MAX_WIND } = GAME_CONSTANTS;

  return {
    distance: Math.floor(Math.random() * (MAX_DISTANCE - MIN_DISTANCE + 1)) + MIN_DISTANCE,
    leftArcherY: Math.floor(Math.random() * (MAX_HEIGHT_OFFSET - MIN_HEIGHT_OFFSET + 1)) + MIN_HEIGHT_OFFSET,
    rightArcherY: Math.floor(Math.random() * (MAX_HEIGHT_OFFSET - MIN_HEIGHT_OFFSET + 1)) + MIN_HEIGHT_OFFSET,
    wind: {
      speed: Math.floor(Math.random() * (MAX_WIND - MIN_WIND + 1)) + MIN_WIND,
      direction: Math.random() > 0.5 ? 'left' : 'right',
    },
  };
}

/**
 * Format hit result for display
 */
export function formatHitResult(result: HitResult): string {
  switch (result.type) {
    case 'headshot':
      return 'HEADSHOT!';
    case 'body':
      return 'Body hit!';
    case 'miss':
      // Check if arrow fell short of target
      if (result.fellShort) {
        const shortDist = Math.abs(result.distanceX);
        if (shortDist > 10) return 'Fell way short!';
        if (shortDist > 5) return 'Fell short';
        return 'Just short!';
      }

      // Arrow reached target X - report height at crossing
      const heightDiff = result.distanceY;
      if (Math.abs(heightDiff) < 0.5) return 'Near miss!';

      if (heightDiff > 3) return 'Sailed over!';
      if (heightDiff > 1) return 'Too high';
      if (heightDiff > 0) return 'Slightly high';
      if (heightDiff < -3) return 'Way under';
      if (heightDiff < -1) return 'Too low';
      return 'Slightly low';
  }
}
