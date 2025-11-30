'use client';

/**
 * Cinematic camera controller for smooth automated camera movement
 */

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore, CameraMode } from '@/lib/game-store';

interface CameraTarget {
  position: Vector3;
  lookAt: Vector3;
}

// Smooth camera interpolation
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function lerpVector3(current: Vector3, target: Vector3, t: number): void {
  current.x = lerp(current.x, target.x, t);
  current.y = lerp(current.y, target.y, t);
  current.z = lerp(current.z, target.z, t);
}

export function CinematicCamera() {
  const { camera } = useThree();
  const {
    cameraMode,
    matchSetup,
    leftArcher,
    rightArcher,
    currentArrowPath,
    currentTurn,
    isPaused,
  } = useGameStore();

  const currentLookAt = useRef(new Vector3(50, 2, 0));
  const arrowFollowIndex = useRef(0);

  // Calculate camera target based on mode
  const getCameraTarget = (): CameraTarget => {
    const centerX = matchSetup ? matchSetup.distance / 2 : 50;
    const distance = matchSetup?.distance ?? 100;
    const leftY = leftArcher?.position.y ?? 0;
    const rightY = rightArcher?.position.y ?? 0;

    switch (cameraMode) {
      case 'intro':
        // Wide side shot showing both archers clearly
        return {
          position: new Vector3(centerX, 8, 50),
          lookAt: new Vector3(centerX, 2, 0),
        };

      case 'left-archer':
        // Close-up on left archer - positioned to see them aiming right
        return {
          position: new Vector3(-8, leftY + 4, 12),
          lookAt: new Vector3(0, leftY + 1.5, 0),
        };

      case 'right-archer':
        // Close-up on right archer - positioned to see them aiming left
        return {
          position: new Vector3(distance + 8, rightY + 4, 12),
          lookAt: new Vector3(distance, rightY + 1.5, 0),
        };

      case 'follow-arrow':
        // Follow the arrow from the side
        if (currentArrowPath && currentArrowPath.length > 0) {
          const idx = Math.min(
            Math.floor(arrowFollowIndex.current),
            currentArrowPath.length - 1
          );
          const arrowPos = currentArrowPath[idx];

          // Camera follows from the side, slightly behind and above the arrow
          return {
            position: new Vector3(arrowPos.x, arrowPos.y + 4, 20),
            lookAt: new Vector3(arrowPos.x, arrowPos.y, 0),
          };
        }
        return {
          position: new Vector3(centerX, 10, 35),
          lookAt: new Vector3(centerX, 3, 0),
        };

      case 'result':
        // Focus on where the arrow landed (target archer)
        const targetX = currentTurn === 'left' ? distance : 0;
        const targetY = currentTurn === 'left' ? rightY : leftY;
        return {
          position: new Vector3(targetX + (currentTurn === 'left' ? -10 : 10), targetY + 4, 15),
          lookAt: new Vector3(targetX, targetY + 1.2, 0),
        };

      case 'overview':
      default:
        // Default overview - see entire battlefield
        return {
          position: new Vector3(centerX, 12, 55),
          lookAt: new Vector3(centerX, 2, 0),
        };
    }
  };

  // Update camera smoothly each frame
  useFrame((_, delta) => {
    // Skip camera movement when paused
    if (isPaused) return;

    const target = getCameraTarget();

    // Different smoothness for different modes
    let smoothness = 0.04;
    if (cameraMode === 'follow-arrow') smoothness = 0.12;
    if (cameraMode === 'result') smoothness = 0.06;

    // Special handling for arrow following
    if (cameraMode === 'follow-arrow' && currentArrowPath && currentArrowPath.length > 0) {
      arrowFollowIndex.current += delta * 60 * 1.2; // Match arrow speed

      const idx = Math.min(
        Math.floor(arrowFollowIndex.current),
        currentArrowPath.length - 1
      );
      const arrowPos = currentArrowPath[idx];

      // Camera follows from the side, tracking the arrow
      target.position.set(arrowPos.x, arrowPos.y + 5, 22);
      target.lookAt.set(arrowPos.x, arrowPos.y, 0);
    }

    // Smoothly interpolate camera position and lookAt
    lerpVector3(camera.position, target.position, smoothness);
    lerpVector3(currentLookAt.current, target.lookAt, smoothness);

    camera.lookAt(currentLookAt.current);
  });

  // Reset arrow follow index when entering follow mode
  useEffect(() => {
    if (cameraMode === 'follow-arrow') {
      arrowFollowIndex.current = 0;
    }
  }, [cameraMode]);

  // Set initial camera position
  useEffect(() => {
    const target = getCameraTarget();
    camera.position.copy(target.position);
    currentLookAt.current.copy(target.lookAt);
    camera.lookAt(currentLookAt.current);
  }, []);

  return null;
}
