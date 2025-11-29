'use client';

/**
 * 3D Archer component - a stylized stick figure with model colors
 */

import { useRef } from 'react';
import { Group } from 'three';
import { Text } from '@react-three/drei';
import { getModelConfig } from '@/config/models';

interface ArcherProps {
  modelId: string;
  position: [number, number, number];
  side: 'left' | 'right';
  health: number;
}

export function Archer({ modelId, position, side, health }: ArcherProps) {
  const groupRef = useRef<Group>(null);
  const config = getModelConfig(modelId);

  // Flip archer to face opponent
  const rotation: [number, number, number] = [0, side === 'left' ? 0 : Math.PI, 0];

  // Scale: 1 unit = 1 meter in game
  // Archer is about 1.8m tall
  const bodyHeight = 1.2;
  const headRadius = 0.3;
  const legLength = 0.6;

  // Opacity based on health
  const opacity = health === 0 ? 0.3 : health === 1 ? 0.7 : 1;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Nameplate */}
      <Text
        position={[0, bodyHeight + headRadius * 2 + 0.8, 0]}
        fontSize={0.4}
        color={config.color}
        anchorX="center"
        anchorY="middle"
        rotation={[0, side === 'left' ? 0 : Math.PI, 0]}
      >
        {config.icon} {config.name}
      </Text>

      {/* Health bar background */}
      <mesh position={[0, bodyHeight + headRadius * 2 + 0.3, 0]} rotation={[0, side === 'left' ? 0 : Math.PI, 0]}>
        <planeGeometry args={[1, 0.15]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      {/* Health bar fill */}
      <mesh
        position={[(health / 2 - 1) * 0.25, bodyHeight + headRadius * 2 + 0.3, 0.01]}
        rotation={[0, side === 'left' ? 0 : Math.PI, 0]}
      >
        <planeGeometry args={[(health / 2) * 1, 0.12]} />
        <meshBasicMaterial color={health === 2 ? '#22c55e' : '#ef4444'} />
      </mesh>

      {/* Head */}
      <mesh position={[0, bodyHeight + headRadius, 0]}>
        <sphereGeometry args={[headRadius, 16, 16]} />
        <meshStandardMaterial color={config.color} transparent opacity={opacity} />
      </mesh>

      {/* Body */}
      <mesh position={[0, bodyHeight / 2 + legLength, 0]}>
        <capsuleGeometry args={[0.15, bodyHeight - 0.3, 8, 16]} />
        <meshStandardMaterial color={config.color} transparent opacity={opacity} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.15, legLength / 2, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.08, legLength - 0.1, 4, 8]} />
        <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.15, legLength / 2, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.08, legLength - 0.1, 4, 8]} />
        <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
      </mesh>

      {/* Bow arm */}
      <mesh position={[side === 'left' ? 0.4 : -0.4, bodyHeight * 0.7 + legLength, 0.2]} rotation={[0, 0, side === 'left' ? -0.5 : 0.5]}>
        <capsuleGeometry args={[0.06, 0.5, 4, 8]} />
        <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
      </mesh>

      {/* Bow (simple arc) */}
      <mesh position={[side === 'left' ? 0.7 : -0.7, bodyHeight * 0.7 + legLength, 0.2]}>
        <torusGeometry args={[0.4, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#8B4513" transparent opacity={opacity} />
      </mesh>
    </group>
  );
}
