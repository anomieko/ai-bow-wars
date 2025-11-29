'use client';

/**
 * Static arrow that's stuck in ground or target
 */

import { getModelConfig } from '@/config/models';
import { StuckArrow as StuckArrowType } from '@/types/game';

interface StuckArrowProps {
  arrow: StuckArrowType;
}

export function StuckArrow({ arrow }: StuckArrowProps) {
  const config = getModelConfig(arrow.modelId);

  // Adjust position based on where it's stuck
  let offsetY = 0;
  if (arrow.stuckIn === 'ground') {
    offsetY = 0.15; // Stick out of ground a bit
  }

  return (
    <group
      position={[arrow.position.x, arrow.position.y + offsetY, 0]}
      rotation={[0, 0, arrow.angle]}
    >
      {/* Arrow shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Arrow head */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Fletching */}
      <mesh position={[-0.25, 0.035, 0]} rotation={[0, 0, 0.4]}>
        <planeGeometry args={[0.1, 0.06]} />
        <meshStandardMaterial color={config.color} side={2} />
      </mesh>
      <mesh position={[-0.25, -0.035, 0]} rotation={[0, 0, -0.4]}>
        <planeGeometry args={[0.1, 0.06]} />
        <meshStandardMaterial color={config.color} side={2} />
      </mesh>
    </group>
  );
}
