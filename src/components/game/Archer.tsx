'use client';

/**
 * 3D Archer component - a stylized stick figure with bow and shooting animation
 */

import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { Text, Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getModelConfig } from '@/config/models';
import { useGameStore } from '@/lib/game-store';

interface ArcherProps {
  modelId: string;
  position: [number, number, number];
  side: 'left' | 'right';
  health: number;
  isHit?: boolean;
  isDrawing?: boolean;  // AI is thinking/aiming
  isShooting?: boolean; // Arrow is being released
  shotAngle?: number;   // Angle in degrees (0-90) for aiming the bow
  speechBubble?: string | null; // Current speech bubble message
}

export function Archer({ modelId, position, side, health, isHit = false, isDrawing = false, isShooting = false, shotAngle = 45, speechBubble = null }: ArcherProps) {
  const groupRef = useRef<Group>(null);
  const config = getModelConfig(modelId);
  const [hitFlash, setHitFlash] = useState(0);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [drawProgress, setDrawProgress] = useState(0); // 0 = relaxed, 1 = fully drawn
  const [currentAimAngle, setCurrentAimAngle] = useState(0); // Smoothly animated aim angle
  const isPaused = useGameStore((s) => s.isPaused);

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
    // Skip all animations when paused
    if (isPaused) return;

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

    // Smoothly animate aim angle when drawing
    const targetAngle = isDrawing || isShooting ? shotAngle : 0;
    const angleDiff = targetAngle - currentAimAngle;
    if (Math.abs(angleDiff) > 0.5) {
      setCurrentAimAngle((prev) => prev + angleDiff * delta * 3);
    }
  });

  // Color flash when hit
  const displayColor = hitFlash > 0 ? '#ff0000' : config.color;

  // Bow dimensions
  const bowRadius = 0.4;
  const stringPull = drawProgress * 0.3;

  // Convert aim angle to radians (positive = counter-clockwise = aiming UP)
  const aimAngleRad = (currentAimAngle * Math.PI) / 180;

  // Shoulder height for bow positioning
  const shoulderY = torsoY + 0.35;

  return (
    <group
      ref={groupRef}
      position={[position[0] + shakeOffset.x, position[1] + shakeOffset.y, position[2]]}
      rotation={rotation}
    >
      {/* Nameplate - no emoji */}
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
        {config.name}
      </Text>

      {/* Speech Bubble - HTML overlay for crisp text */}
      {speechBubble && (
        <Html
          position={[0, bodyHeight + headRadius * 2 + legLength + 1.0, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'white',
              color: '#1a1a1a',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'system-ui, sans-serif',
              width: 'max-content',
              maxWidth: '320px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid #333',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {speechBubble}
            {/* Tail */}
            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #333',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
              }}
            />
          </div>
        </Html>
      )}

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

      {/* === BOW + HANDS (no arms, just floating blob hands) === */}
      {/* This group rotates together to aim at the target */}
      <group position={[0, shoulderY, 0]} rotation={[0, 0, aimAngleRad]}>
        {/* Bow positioned at arm's reach from body */}
        <group position={[0.6, 0, 0]}>
          {/* Bow wood (curved limbs) */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <torusGeometry args={[bowRadius, 0.05, 12, 32, Math.PI]} />
            <meshBasicMaterial color="#8B4513" />
          </mesh>

          {/* Bow grip */}
          <mesh position={[bowRadius, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
            <meshStandardMaterial color="#3D2A0A" />
          </mesh>

          {/* Front hand (holding bow grip) */}
          <mesh position={[bowRadius, 0, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
          </mesh>

          {/* Bow string */}
          <Line
            points={[
              [0, bowRadius, 0],
              [-0.1 - stringPull, 0, 0],
              [0, -bowRadius, 0],
            ]}
            color="#d4c4a8"
            lineWidth={2}
          />

          {/* Arrow on string - feathers at string, arrow extends through bow */}
          {drawProgress > 0.1 && (
            <group position={[-0.1 - stringPull, 0, 0]}>
              {/* Arrow shaft - long enough to extend past the bow */}
              <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.015, 0.015, 0.95, 6]} />
                <meshStandardMaterial color="#8B7355" />
              </mesh>
              {/* Arrowhead - extends beyond the bow */}
              <mesh position={[0.97, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.035, 0.1, 6]} />
                <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Feathers - at the string */}
              <mesh position={[0.03, 0.025, 0]} rotation={[0, 0, 0.3]}>
                <planeGeometry args={[0.08, 0.04]} />
                <meshStandardMaterial color={config.color} side={2} />
              </mesh>
              <mesh position={[0.03, -0.025, 0]} rotation={[0, 0, -0.3]}>
                <planeGeometry args={[0.08, 0.04]} />
                <meshStandardMaterial color={config.color} side={2} />
              </mesh>
            </group>
          )}

          {/* Back hand (pulling string) */}
          <mesh position={[-0.1 - stringPull, 0, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={config.accentColor} transparent opacity={opacity} />
          </mesh>
        </group>
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
