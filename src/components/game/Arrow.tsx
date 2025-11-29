'use client';

/**
 * Animated arrow that follows a path
 */

import { useRef, useEffect, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import { Vector2 } from '@/types/game';
import { getModelConfig } from '@/config/models';

interface ArrowProps {
  path: Vector2[];
  modelId: string;
  onComplete: () => void;
  speed?: number;
}

export function Arrow({ path, modelId, onComplete, speed = 1 }: ArrowProps) {
  const groupRef = useRef<Group>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const config = getModelConfig(modelId);

  // Animate along path
  useFrame((_, delta) => {
    if (isComplete || !groupRef.current || path.length === 0) return;

    const nextIndex = currentIndex + delta * 60 * speed; // 60fps base

    if (nextIndex >= path.length - 1) {
      // Animation complete
      const finalPos = path[path.length - 1];
      groupRef.current.position.set(finalPos.x, finalPos.y, 0);
      setIsComplete(true);
      onComplete();
      return;
    }

    // Interpolate position
    const floorIndex = Math.floor(nextIndex);
    const t = nextIndex - floorIndex;
    const current = path[floorIndex];
    const next = path[Math.min(floorIndex + 1, path.length - 1)];

    const x = current.x + (next.x - current.x) * t;
    const y = current.y + (next.y - current.y) * t;

    groupRef.current.position.set(x, y, 0);

    // Rotate arrow to face direction of travel
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const angle = Math.atan2(dy, dx);
    groupRef.current.rotation.z = angle;

    setCurrentIndex(nextIndex);
  });

  // Set initial position
  useEffect(() => {
    if (groupRef.current && path.length > 0) {
      groupRef.current.position.set(path[0].x, path[0].y, 0);
    }
  }, [path]);

  if (path.length === 0) return null;

  return (
    <group ref={groupRef}>
      <Trail
        width={0.3}
        length={8}
        color={config.color}
        attenuation={(t) => t * t}
      >
        <mesh>
          {/* Arrow shaft */}
          <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </Trail>

      {/* Arrow head */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Fletching */}
      <mesh position={[-0.25, 0.03, 0]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.15, 0.06]} />
        <meshStandardMaterial color={config.color} side={2} />
      </mesh>
      <mesh position={[-0.25, -0.03, 0]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.15, 0.06]} />
        <meshStandardMaterial color={config.color} side={2} />
      </mesh>
    </group>
  );
}
