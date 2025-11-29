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
  const windEffect = wind.direction === 'left' ? -wind.speed * 0.1 : wind.speed * 0.1;

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

  // If no hit, calculate miss distance
  if (!hasHit) {
    const targetX = targetArcher.position.x;
    const targetY = targetArcher.position.y + BODY_HITBOX_HEIGHT / 2; // Center of body

    // Find the closest point on the path to the target
    let closestDist = Infinity;
    let closestPoint = path[path.length - 1] || { x, y };

    for (const point of path) {
      const dist = Math.sqrt(
        Math.pow(point.x - targetX, 2) + Math.pow(point.y - targetY, 2)
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestPoint = point;
      }
    }

    hitResult = {
      type: 'miss',
      distanceX: Math.round((closestPoint.x - targetX) * 10) / 10,
      distanceY: Math.round((closestPoint.y - targetY) * 10) / 10,
    };
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
      // Vague feedback for display
      const parts: string[] = [];
      if (Math.abs(result.distanceX) > 0.5) {
        parts.push(result.distanceX > 0 ? 'long' : 'short');
      }
      if (Math.abs(result.distanceY) > 0.5) {
        parts.push(result.distanceY > 0 ? 'high' : 'low');
      }
      return parts.length > 0 ? `Miss (${parts.join(', ')})` : 'Near miss!';
  }
}
