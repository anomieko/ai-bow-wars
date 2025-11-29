'use client';

/**
 * 3D Archer component - a stylized stick figure with bow and shooting animation
 */

import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { Text, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getModelConfig } from '@/config/models';

interface ArcherProps {
  modelId: string;
  position: [number, number, number];
  side: 'left' | 'right';
  health: number;
  isHit?: boolean;
  isDrawing?: boolean;  // AI is thinking/aiming
  isShooting?: boolean; // Arrow is being released
}

export function Archer({ modelId, position, side, health, isHit = false, isDrawing = false, isShooting = false }: ArcherProps) {
  const groupRef = useRef<Group>(null);
  const config = getModelConfig(modelId);
  const [hitFlash, setHitFlash] = useState(0);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [drawProgress, setDrawProgress] = useState(0); // 0 = relaxed, 1 = fully drawn

  // Flip archer to face opponent
  const rotation: [number, number, number] = [0, side === 'left' ? 0 : Math.PI, 0];

  // Scale: 1 unit = 1 meter in game
  const bodyHeight = 1.2;
  const headRadius = 0.25;
  const legLength = 0.7;
  const torsoY = bodyHeight / 2 + legLength;

  // Opacity based on health
  const opacity = health === 0 ? 0.3 : health === 1 ? 0.7 : 1;

  // Hit flash effect
  useEffect(() => {
    if (isHit) {
      setHitFlash(1);
      const timer = setTimeout(() => setHitFlash(0), 300);
      return () => clearTimeout(timer);
    }
  }, [isHit]);

  // Animate draw progress
  useFrame((_, delta) => {
    // Hit shake
    if (hitFlash > 0) {
      setShakeOffset({
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.05,
      });
      setHitFlash((prev) => Math.max(0, prev - 0.02));
    } else {
      setShakeOffset({ x: 0, y: 0 });
    }

    // Draw animation
    if (isDrawing && drawProgress < 1) {
      setDrawProgress((prev) => Math.min(1, prev + delta * 0.8));
    } else if (isShooting && drawProgress > 0) {
      // Quick release when shooting
      setDrawProgress((prev) => Math.max(0, prev - delta * 8));
    } else if (!isDrawing && !isShooting && drawProgress > 0) {
      // Slowly return to rest
      setDrawProgress((prev) => Math.max(0, prev - delta * 2));
    }
  });

  // Color flash when hit
  const displayColor = hitFlash > 0 ? '#ff0000' : config.color;

  // Bow dimensions
  const bowRadius = 0.45;
  const bowX = 0.55;
  const bowY = torsoY + 0.15;

  // String pull distance based on draw progress
  const stringPull = drawProgress * 0.35;

  // Arm positions based on draw
  const bowArmAngle = -0.3 - drawProgress * 0.2; // Front arm extends more
  const drawArmX = -0.1 - stringPull; // Pull arm back
  const drawArmAngle = 0.5 + drawProgress * 0.8; // Pull arm bends more

  return (
    <group
      ref={groupRef}
      position={[position[0] + shakeOffset.x, position[1] + shakeOffset.y, position[2]]}
      rotation={rotation}
    >
      {/* Nameplate */}
      <Text
        position={[0, bodyHeight + headRadius * 2 + legLength + 0.3, 0]}
        fontSize={0.45}
        color={config.color}
        anchorX="center"
        anchorY="middle"
        rotation={[0, side === 'left' ? 0 : Math.PI, 0]}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {config.icon} {config.name}
      </Text>

      {/* Provider tag */}
      <Text
        position={[0, bodyHeight + headRadius * 2 + legLength - 0.05, 0]}
        fontSize={0.2}
        color="#888888"
        anchorX="center"
        anchorY="middle"
        rotation={[0, side === 'left' ? 0 : Math.PI, 0]}
      >
        {config.provider}
      </Text>

      {/* Health bar background */}
      <mesh position={[0, bodyHeight + headRadius * 2 + legLength - 0.35, 0]} rotation={[0, side === 'left' ? 0 : Math.PI, 0]}>
        <planeGeometry args={[1.0, 0.15]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* Health bar fill */}
      <mesh
        position={[(health / 2 - 1) * 0.25, bodyHeight + headRadius * 2 + legLength - 0.35, 0.01]}
        rotation={[0, side === 'left' ? 0 : Math.PI, 0]}
      >
        <planeGeometry args={[(health / 2) * 1.0, 0.12]} />
        <meshBasicMaterial color={health === 2 ? '#22c55e' : '#ef4444'} />
      </mesh>

      {/* Head */}
      <mesh position={[0, bodyHeight + headRadius + legLength, 0]}>
        <sphereGeometry args={[headRadius, 16, 16]} />
        <meshStandardMaterial color={displayColor} transparent opacity={opacity} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, torsoY, 0]}>
        <capsuleGeometry args={[0.12, bodyHeight - 0.3, 8, 16]} />
        <meshStandardMaterial color={displayColor} transparent opacity={opacity} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.12, legLength / 2, 0]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.07, legLength - 0.1, 4, 8]} />
        <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.12, legLength / 2, 0]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.07, legLength - 0.1, 4, 8]} />
        <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
      </mesh>

      {/* === BOW ARM (front arm holding bow) === */}
      <group position={[0.15, torsoY + 0.3, 0]}>
        {/* Upper arm */}
        <mesh position={[0.15, 0, 0.05]} rotation={[0, 0, bowArmAngle]}>
          <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
          <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0.35, -0.05, 0.05]} rotation={[0, 0, bowArmAngle - 0.2]}>
          <capsuleGeometry args={[0.045, 0.25, 4, 8]} />
          <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* === DRAW ARM (back arm pulling string) === */}
      <group position={[-0.15, torsoY + 0.3, 0]}>
        {/* Upper arm */}
        <mesh position={[drawArmX, 0, 0.05]} rotation={[0, 0, drawArmAngle]}>
          <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
          <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
        </mesh>
        {/* Forearm - reaches to string */}
        <mesh position={[drawArmX - 0.1 - stringPull * 0.5, -0.1, 0.05]} rotation={[0, 0, drawArmAngle + 0.3]}>
          <capsuleGeometry args={[0.045, 0.25, 4, 8]} />
          <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* === BOW === */}
      <group position={[bowX, bowY, 0.1]}>
        {/* Bow limbs (curved wood) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[bowRadius, 0.025, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#5D3A1A" />
        </mesh>

        {/* Bow grip (center) */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
          <meshStandardMaterial color="#3D2A0A" />
        </mesh>

        {/* Bow string - curved when drawn */}
        <Line
          points={[
            [0, bowRadius, 0],           // Top of bow
            [-stringPull, 0, 0],          // String pull point (center, pulled back)
            [0, -bowRadius, 0],          // Bottom of bow
          ]}
          color="#d4c4a8"
          lineWidth={2}
        />

        {/* Arrow nocked on string (only when drawing) */}
        {drawProgress > 0.1 && (
          <group position={[-stringPull + 0.05, 0, 0]} rotation={[0, 0, 0]}>
            {/* Arrow shaft */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />
              <meshStandardMaterial color="#8B7355" />
            </mesh>
            {/* Arrow head */}
            <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.04, 0.12, 6]} />
              <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Fletching */}
            <mesh position={[-0.25, 0.03, 0]} rotation={[0, 0, 0.3]}>
              <planeGeometry args={[0.1, 0.05]} />
              <meshStandardMaterial color={config.color} side={2} />
            </mesh>
            <mesh position={[-0.25, -0.03, 0]} rotation={[0, 0, -0.3]}>
              <planeGeometry args={[0.1, 0.05]} />
              <meshStandardMaterial color={config.color} side={2} />
            </mesh>
          </group>
        )}
      </group>

      {/* Hit indicator particles */}
      {hitFlash > 0 && (
        <>
          {[...Array(8)].map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 0.6,
                torsoY + (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.3,
              ]}
            >
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
